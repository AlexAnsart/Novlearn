"""
API FastAPI pour Novlearn
Backend principal de l'application avec système de duels et amis
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import logging
import random

from config import settings
from auth import verify_token, get_supabase_client
from recommandation import recommander_exercice
from chapter_placement_test import (
    fetch_or_start_test,
    get_next_test_exercise,
    is_chapter_test_completed,
)
from chapter_selection import select_chapter_for_recommendation

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Reduce noise from HTTP clients and auth (Supabase/httpx, token verification)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("auth").setLevel(logging.WARNING)

# ============================================
# CONSTANTS
# ============================================

# duel_settings no longer needed — game logic moved to Colyseus duel-server

# Création de l'application FastAPI
app = FastAPI(
    title="Novlearn API",
    description="API REST pour la plateforme Novlearn avec système de duels 1v1",
    version="0.2.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class FriendCodeResponse(BaseModel):
    code: str
    invite_link: str


class AddFriendByCodeRequest(BaseModel):
    code: str


class CreateDuelRequest(BaseModel):
    friend_id: str
    exercise_id: Optional[int] = None


class DuelActionRequest(BaseModel):
    duel_id: int



# ============================================
# HEALTH CHECK
# ============================================

@app.get("/")
async def root():
    """Endpoint racine de l'API"""
    return JSONResponse(
        content={
            "message": "Novlearn API with Duels System",
            "version": "0.2.0",
            "status": "running"
        }
    )


@app.get("/health")
async def health_check():
    """Endpoint de vérification de santé de l'API"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "Novlearn API"
        }
    )


@app.get("/api/health")
async def api_health_check():
    """Endpoint de vérification de santé de l'API (alias)"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "Novlearn API"
        }
    )


# ============================================
# RECOMMENDATION
# ============================================

@app.get("/api/recommend-exercise")
async def recommend_exercise(
    user: dict = Depends(verify_token),
    chapter: Optional[str] = None,
):
    """
    Recommande un exercice pour l'utilisateur connecté.
    chapter (query, optionnel) : limiter au chapitre. Si absent, utilise l'algo de sélection.
    Retourne exercise_id, competences (array), difficulty_level, difficulty, mode (test|recommendation).
    Si l'utilisateur n'a pas passé le test de placement du chapitre, retourne un exo de test.
    """
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        # When no chapter specified (e.g. page principale /exercices), select one via algo
        effective_chapter = chapter
        if not effective_chapter or not effective_chapter.strip():
            effective_chapter = select_chapter_for_recommendation(supabase, user_id)
            if not effective_chapter:
                logger.warning(
                    "[API] recommend-exercise: no chapter available for user=%s",
                    user_id[:8],
                )
                raise HTTPException(
                    status_code=404,
                    detail="Aucun chapitre avec exercices disponible",
                )

        logger.info(
            "[API] recommend-exercise: request from user=%s chapter=%s (effective=%s)",
            user_id[:8],
            chapter or "all",
            effective_chapter,
        )

        # Try placement test first if not completed for this chapter
        try:
            result = fetch_or_start_test(supabase, user_id, effective_chapter)
            if result:
                result["mode"] = "test"
                logger.info(
                    "[API] recommend-exercise: serving chapter test for user=%s chapter=%s exercise_id=%s",
                    user_id[:8],
                    result.get("chapter", ""),
                    result.get("exercise_id"),
                )
                return JSONResponse(content=result)
        except Exception as test_error:
            logger.warning(
                "[API] recommend-exercise: test system unavailable for user=%s chapter=%s: %s. Falling back to normal recommendation.",
                user_id[:8],
                effective_chapter,
                str(test_error),
            )

        result = recommander_exercice(supabase, user_id, chapter=effective_chapter)
        if not result:
            logger.warning(
                "[API] recommend-exercise: no exercise found for user=%s chapter=%s",
                user_id[:8],
                chapter or "all",
            )
            raise HTTPException(status_code=404, detail="Aucun exercice recommandé")
        result["mode"] = "recommendation"
        logger.info(
            "[API] recommend-exercise: serving recommendation for user=%s chapter=%s exercise_id=%s competences=%s",
            user_id[:8],
            chapter or "all",
            result.get("exercise_id"),
            result.get("competences"),
        )
        # Ensure competences array is included in response
        competences_array = result.get("competences")
        if not competences_array or not isinstance(competences_array, list) or len(competences_array) == 0:
            logger.warning(
                "[API] recommend-exercise: WARNING - competences array is missing or empty for exercise_id=%s",
                result.get("exercise_id"),
            )
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("recommend_exercise error: %s", e)
        raise HTTPException(status_code=500, detail="Erreur lors de la recommandation")


class ChapterTestNextRequest(BaseModel):
    chapter: str
    last_success: bool


@app.post("/api/chapter-test/next")
async def chapter_test_next(
    body: ChapterTestNextRequest,
    user: dict = Depends(verify_token),
):
    """
    Returns next exercise for chapter placement test after user completed one.
    Body: { chapter, last_success }.
    Returns next exercise or { completed: true } when test is done.
    """
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        result = get_next_test_exercise(
            supabase, user_id, body.chapter, body.last_success
        )
        if result is None:
            return JSONResponse(
                content={"completed": True, "chapter": body.chapter}
            )
        return JSONResponse(content=result)
    except Exception as e:
        logger.exception("chapter_test_next error: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération du prochain exercice de test",
        )


@app.get("/api/chapter-test/status")
async def chapter_test_status(
    user: dict = Depends(verify_token),
    chapter: Optional[str] = None,
):
    """
    Returns whether the user has completed the placement test for the chapter.
    """
    try:
        from chapter_placement_test import get_chapter_for_test
        supabase = get_supabase_client()
        user_id = user["user_id"]
        ch = get_chapter_for_test(chapter)
        completed = is_chapter_test_completed(supabase, user_id, ch)
        return JSONResponse(content={"completed": completed, "chapter": ch})
    except Exception as e:
        logger.exception("chapter_test_status error: %s", e)
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification")


# ============================================
# FRIENDS ENDPOINTS
# ============================================

@app.get("/api/friends/code")
async def get_friend_code(user: dict = Depends(verify_token)):
    """Get or generate friend code for current user"""
    try:
        logger.info(f"get_friend_code called for user: {user.get('user_id')}")
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Check if user already has a code
        logger.info(f"Checking for existing friend code for user: {user_id}")
        result = supabase.table("friend_codes").select("*").eq("user_id", user_id).execute()
        logger.info(f"Friend codes query result: {len(result.data) if result.data else 0} codes found")
        
        if result.data and len(result.data) > 0:
            code = result.data[0]["code"]
            logger.info(f"Using existing code: {code}")
        else:
            # Generate new code (should be handled by trigger, but fallback)
            code = generate_unique_code()
            logger.info(f"Generating new code: {code}")
            insert_result = supabase.table("friend_codes").insert({
                "user_id": user_id,
                "code": code
            }).execute()
            logger.info(f"Code inserted: {insert_result.data is not None if insert_result.data else False}")
        
        invite_link = f"https://novlearn.fr/invite/{code}"
        logger.info(f"Returning code and invite link for user: {user_id}")
        
        return FriendCodeResponse(code=code, invite_link=invite_link)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting friend code: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/friends/add-by-code")
async def add_friend_by_code(request: AddFriendByCodeRequest, user: dict = Depends(verify_token)):
    """Add friend using their invite code"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Find user by code
        code_result = supabase.table("friend_codes").select("user_id").eq("code", request.code).execute()
        
        if not code_result.data or len(code_result.data) == 0:
            raise HTTPException(status_code=404, detail="Code d'ami invalide")
        
        friend_id = code_result.data[0]["user_id"]
        
        # Check if trying to add themselves
        if friend_id == user_id:
            raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous ajouter vous-même")
        
        # Check if already friends
        user1 = min(user_id, friend_id)
        user2 = max(user_id, friend_id)
        
        existing = supabase.table("friends").select("*").eq("user1_id", user1).eq("user2_id", user2).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="Vous êtes déjà amis")
        
        # Check for existing request
        existing_request = supabase.table("friend_requests").select("*")\
            .eq("from_user_id", user_id)\
            .eq("to_user_id", friend_id)\
            .eq("status", "pending")\
            .execute()
        
        if existing_request.data and len(existing_request.data) > 0:
            raise HTTPException(status_code=400, detail="Demande d'ami déjà envoyée")
        
        # Create friend request
        supabase.table("friend_requests").insert({
            "from_user_id": user_id,
            "to_user_id": friend_id,
            "status": "pending"
        }).execute()
        
        return {"message": "Demande d'ami envoyée avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/friends")
async def get_friends(user: dict = Depends(verify_token)):
    """Get list of friends for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        logger.info("[API /api/friends] user_id=%s", user_id[:8] if user_id else None)

        # Get friendships where user is either user1 or user2
        friends_data = []
        friend_ids = []

        # Query as user1 - get user2_ids
        result1 = supabase.table("friends")\
            .select("user2_id")\
            .eq("user1_id", user_id)\
            .eq("status", "accepted")\
            .execute()
        logger.info("[API /api/friends] as user1: rows=%s", len(result1.data or []))

        for friend in result1.data or []:
            friend_ids.append(friend["user2_id"])

        # Query as user2 - get user1_ids
        result2 = supabase.table("friends")\
            .select("user1_id")\
            .eq("user2_id", user_id)\
            .eq("status", "accepted")\
            .execute()
        logger.info("[API /api/friends] as user2: rows=%s", len(result2.data or []))

        for friend in result2.data or []:
            friend_ids.append(friend["user1_id"])

        logger.info("[API /api/friends] friend_ids count=%s ids=%s", len(friend_ids), friend_ids[:5] if friend_ids else [])
        
        # Get profiles for all friend IDs
        if friend_ids:
            profiles_result = supabase.table("profiles")\
                .select("id, first_name, last_name, email")\
                .in_("id", friend_ids)\
                .execute()
            
            # Create a map of user_id -> profile
            profiles_map = {p["id"]: p for p in (profiles_result.data or [])}
            
            # Build friends data
            for friend_id in friend_ids:
                profile = profiles_map.get(friend_id, {})
                email = profile.get("email", "")
                first_name = profile.get("first_name", "")
                last_name = profile.get("last_name", "")
                name = f"{first_name} {last_name}".strip() or email.split("@")[0] if email else ""
                
                friends_data.append({
                    "id": friend_id,
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": name
                })

        logger.info("[API /api/friends] response friends count=%s", len(friends_data))
        return {"friends": friends_data}

    except Exception as e:
        logger.error(f"Error getting friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/friends/{friend_id}")
async def remove_friend(friend_id: str, user: dict = Depends(verify_token)):
    """Remove a friend (delete the friendship)."""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        if friend_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot remove yourself")
        user1 = min(user_id, friend_id)
        user2 = max(user_id, friend_id)
        supabase.table("friends").delete().eq("user1_id", user1).eq("user2_id", user2).execute()
        return {"message": "Friend removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/friends/requests")
async def get_friend_requests(user: dict = Depends(verify_token)):
    """Get pending friend requests for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get requests where user is the recipient
        result = supabase.table("friend_requests")\
            .select("id, from_user_id, created_at")\
            .eq("to_user_id", user_id)\
            .eq("status", "pending")\
            .execute()
        
        requests_data = []
        from_user_ids = []
        
        # Collect request IDs and from_user_ids
        for req in result.data or []:
            from_user_ids.append(req["from_user_id"])
        
        # Get profiles for all from_user_ids
        if from_user_ids:
            profiles_result = supabase.table("profiles")\
                .select("id, first_name, last_name, email")\
                .in_("id", from_user_ids)\
                .execute()
            
            # Create a map of user_id -> profile
            profiles_map = {p["id"]: p for p in (profiles_result.data or [])}
            
            # Build requests data
            for req in result.data or []:
                from_user_id = req["from_user_id"]
                profile = profiles_map.get(from_user_id, {})
                email = profile.get("email", "")
                first_name = profile.get("first_name", "")
                last_name = profile.get("last_name", "")
                from_user_name = f"{first_name} {last_name}".strip() or email.split("@")[0] if email else ""
                
                requests_data.append({
                    "id": req.get("id"),
                    "from_user_id": from_user_id,
                    "from_user_name": from_user_name,
                    "created_at": req.get("created_at")
                })
        
        return {"requests": requests_data}
    
    except Exception as e:
        logger.error(f"Error getting friend requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/friends/requests/{request_id}/accept")
async def accept_friend_request(request_id: int, user: dict = Depends(verify_token)):
    """Accept a friend request"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Update request status (trigger will handle creating friendship)
        result = supabase.table("friend_requests")\
            .update({"status": "accepted", "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", request_id)\
            .eq("to_user_id", user_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
        
        return {"message": "Demande d'ami acceptée"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/friends/requests/{request_id}/decline")
async def decline_friend_request(request_id: int, user: dict = Depends(verify_token)):
    """Decline a friend request"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        result = supabase.table("friend_requests")\
            .update({"status": "declined", "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", request_id)\
            .eq("to_user_id", user_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
        
        return {"message": "Demande d'ami refusée"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DUELS ENDPOINTS (lobby only — game state lives in Colyseus duel-server)
# ============================================

@app.post("/api/duels/create")
async def create_duel(request: CreateDuelRequest, user: dict = Depends(verify_token)):
    """Create a duel challenge"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Check if users are friends
        user1 = min(user_id, request.friend_id)
        user2 = max(user_id, request.friend_id)
        
        friendship = supabase.table("friends")\
            .select("*")\
            .eq("user1_id", user1)\
            .eq("user2_id", user2)\
            .eq("status", "accepted")\
            .execute()
        
        if not friendship.data:
            raise HTTPException(status_code=400, detail="Vous devez être amis pour lancer un duel")
        
        # Create duel (exercise will be chosen randomly when the duel is accepted)
        duel_data = {
            "player1_id": user_id,
            "player2_id": request.friend_id,
            "status": "waiting",
            "player1_score": 0,
            "player2_score": 0
        }
        
        result = supabase.table("duels").insert(duel_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création du duel")
        
        return {"message": "Duel créé avec succès", "duel_id": result.data[0]["id"], "duel": result.data[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/duels/{duel_id}/accept")
async def accept_duel(duel_id: int, user: dict = Depends(verify_token)):
    """
    Accept a duel challenge.
    Marks the duel as 'active' in DB so player1 gets the Supabase Realtime notification
    and navigates to /duel/active/[id]. Both players then connect to the Colyseus room.
    """
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        duel = supabase.table("duels").select("id, player1_id, player2_id, status").eq("id", duel_id).execute()
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")

        duel_data = duel.data[0]
        if duel_data["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accepter ce duel")

        player1_id = duel_data["player1_id"]
        now_iso = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()

        # Close any stale active duels involving either player (exclude this duel).
        # This prevents the redirect from picking an old duel instead of the new one.
        for pid in {player1_id, user_id}:
            supabase.table("duels").update({
                "status": "finished",
                "finished_at": now_iso,
            }).eq("status", "active").neq("id", duel_id).or_(
                f"player1_id.eq.{pid},player2_id.eq.{pid}"
            ).execute()

        result = supabase.table("duels").update({
            "status": "active",
            "started_at": now_iso,
        }).eq("id", duel_id).execute()

        logger.info("[API] duel accepted duel_id=%s player2=%s", duel_id, user_id[:8])
        return {"message": "Duel accepté", "duel": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/duels/{duel_id}/decline")
async def decline_duel(duel_id: int, user: dict = Depends(verify_token)):
    """Decline a duel challenge."""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        duel = supabase.table("duels").select("id, player2_id").eq("id", duel_id).execute()
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        if duel.data[0]["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à refuser ce duel")

        supabase.table("duels").delete().eq("id", duel_id).execute()
        return {"message": "Duel refusé"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/pending")
async def get_pending_duels(user: dict = Depends(verify_token)):
    """Get pending duel requests for current user."""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        result = supabase.table("duels")\
            .select("id, player1_id, created_at")\
            .eq("player2_id", user_id)\
            .eq("status", "waiting")\
            .execute()

        player1_ids = [d["player1_id"] for d in result.data or [] if d.get("player1_id")]
        profiles_map = {}
        if player1_ids:
            pr = supabase.table("profiles").select("id, first_name, last_name, email").in_("id", player1_ids).execute()
            profiles_map = {p["id"]: p for p in (pr.data or [])}

        duels_data = []
        for duel in result.data or []:
            p = profiles_map.get(duel.get("player1_id"), {})
            name = f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() or p.get("email", "").split("@")[0] or ""
            duels_data.append({
                "id": duel["id"],
                "from_user_id": duel.get("player1_id"),
                "from_user_name": name,
                "exercise_title": "Exercice",
                "created_at": duel.get("created_at"),
            })

        return {"duels": duels_data}

    except Exception as e:
        logger.error(f"Error getting pending duels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/active")
async def get_active_duels(user: dict = Depends(verify_token)):
    """
    Active duels for the current user (lobby redirect check only).
    The real game state lives in the Colyseus room.
    """
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        result = supabase.table("duels")\
            .select("id, player1_id, player2_id, status, created_at")\
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")\
            .eq("status", "active")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        return {"duels": result.data or []}

    except Exception as e:
        logger.error(f"Error getting active duels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/history")
async def get_duel_history(user: dict = Depends(verify_token)):
    """Finished duels history for current user. Declared before /{duel_id} to avoid route conflict."""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        result = (
            supabase.table("duels")
            .select("id, player1_id, player2_id, player1_score, player2_score, winner_id, created_at, finished_at")
            .eq("status", "finished")
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")
            .order("finished_at", desc=True)
            .limit(50)
            .execute()
        )

        duels = result.data or []
        opponent_ids: List[str] = []
        for d in duels:
            opp = d["player2_id"] if d.get("player1_id") == user_id else d.get("player1_id")
            if opp:
                opponent_ids.append(opp)

        profiles_map = {}
        if opponent_ids:
            pr = supabase.table("profiles").select("id, first_name, last_name, email").in_("id", opponent_ids).execute()
            profiles_map = {p["id"]: p for p in (pr.data or [])}

        history_items = []
        for d in duels:
            is_p1 = d.get("player1_id") == user_id
            opponent_id = d.get("player2_id") if is_p1 else d.get("player1_id")
            my_score = (d.get("player1_score") or 0) if is_p1 else (d.get("player2_score") or 0)
            opponent_score = (d.get("player2_score") or 0) if is_p1 else (d.get("player1_score") or 0)

            p = profiles_map.get(opponent_id or "", {})
            name = f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() or p.get("email", "").split("@")[0] or "Adversaire"

            result_label = "draw"
            if d.get("winner_id") == user_id:
                result_label = "win"
            elif d.get("winner_id") and d.get("winner_id") != user_id:
                result_label = "loss"

            history_items.append({
                "id": d.get("id"),
                "opponent_id": opponent_id,
                "opponent_name": name,
                "my_score": my_score,
                "opponent_score": opponent_score,
                "result": result_label,
                "created_at": d.get("created_at"),
                "finished_at": d.get("finished_at"),
            })

        return {"history": history_items}

    except Exception as e:
        logger.error(f"Error getting duel history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HELPERS
# ============================================

def generate_unique_code(length: int = 8) -> str:
    import string
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('I', '').replace('O', '').replace('0', '').replace('1', '')
    return ''.join(random.choice(chars) for _ in range(length))


if __name__ == "__main__":
    import uvicorn
    if settings.debug:
        uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
    else:
        uvicorn.run(app, host=settings.host, port=settings.port, reload=False)
