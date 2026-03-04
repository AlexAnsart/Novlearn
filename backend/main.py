"""
API FastAPI pour Novlearn
Backend principal de l'application avec système de duels et amis
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
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

from settings.duel_settings import (
    DUEL_CORRECTION_DISPLAY_SECONDS,
    DUEL_DURATION_SECONDS,
    DUEL_EXERCISE_TIMEOUT_SECONDS,
)

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


class SubmitDuelAnswerRequest(BaseModel):
    duel_id: int
    element_id: int
    answer: str
    is_correct: bool
    time_spent: int  # milliseconds; clamped to avoid DB INT overflow and timestamp-as-delta bugs

    @field_validator("time_spent", mode="before")
    @classmethod
    def clamp_time_spent(cls, v: object) -> int:
        """Ensure time_spent fits in PostgreSQL INT and is not a mistaken timestamp."""
        if v is None:
            return 0
        try:
            x = int(v)
        except (TypeError, ValueError):
            return 0
        if x < 0:
            return 0
        if x > 600_000:  # > 10 min => likely bug (e.g. Date.now() sent as delta)
            return 0
        return min(x, 2_147_483_647)


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
# DUELS ENDPOINTS
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
    """Accept a duel challenge"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duel
        duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
        
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel_data = duel.data[0]
        
        # Check if user is player2
        if duel_data["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accepter ce duel")
        
        # Pick a completely random exercise to start the duel
        exercise_row, exercise_data = get_random_exercise_with_variables(supabase)
        if not exercise_row:
            raise HTTPException(status_code=404, detail="Aucun exercice disponible")

        now_utc = datetime.utcnow().replace(tzinfo=timezone.utc)
        exercise_data_with_time = {**exercise_data, "started_at": now_utc.isoformat()}
        # Update duel status and attach first random exercise
        update_data = {
            "status": "active",
            "started_at": now_utc.isoformat(),
            "exercise_id": exercise_row["id"],
            "exercise_data": exercise_data_with_time,
        }
        
        result = supabase.table("duels").update(update_data).eq("id", duel_id).execute()
        
        duel_updated = result.data[0]
        logger.info(
            "[API] duel accepted duel_id=%s player2=%s -> redirect to /duel/active/%s",
            duel_id, user_id[:8], duel_id,
        )
        return {"message": "Duel accepté", "duel": duel_updated}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/duels/{duel_id}/decline")
async def decline_duel(duel_id: int, user: dict = Depends(verify_token)):
    """Decline a duel challenge"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duel
        duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
        
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel_data = duel.data[0]
        
        # Check if user is player2
        if duel_data["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à refuser ce duel")
        
        # Delete duel
        supabase.table("duels").delete().eq("id", duel_id).execute()
        
        return {"message": "Duel refusé"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/pending")
async def get_pending_duels(user: dict = Depends(verify_token)):
    """Get pending duel requests for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duels where user is player2 and status is waiting
        result = supabase.table("duels")\
            .select("id, player1_id, exercise_id, created_at")\
            .eq("player2_id", user_id)\
            .eq("status", "waiting")\
            .execute()
        
        duels_data = []
        player1_ids = []
        exercise_ids = []
        
        # Collect IDs
        for duel in result.data or []:
            if duel.get("player1_id"):
                player1_ids.append(duel["player1_id"])
            if duel.get("exercise_id"):
                exercise_ids.append(duel["exercise_id"])
        
        # Get profiles for player1_ids
        profiles_map = {}
        if player1_ids:
            profiles_result = supabase.table("profiles")\
                .select("id, first_name, last_name, email")\
                .in_("id", player1_ids)\
                .execute()
            profiles_map = {p["id"]: p for p in (profiles_result.data or [])}
        
        # Get exercises
        exercises_map = {}
        if exercise_ids:
            exercises_result = supabase.table("exercises")\
                .select("id, title")\
                .in_("id", exercise_ids)\
                .execute()
            exercises_map = {e["id"]: e for e in (exercises_result.data or [])}
        
        # Build duels data
        for duel in result.data or []:
            player1_id = duel.get("player1_id")
            exercise_id = duel.get("exercise_id")
            
            profile = profiles_map.get(player1_id, {})
            email = profile.get("email", "")
            first_name = profile.get("first_name", "")
            last_name = profile.get("last_name", "")
            from_user_name = f"{first_name} {last_name}".strip() or email.split("@")[0] if email else ""
            
            exercise = exercises_map.get(exercise_id, {})
            exercise_title = exercise.get("title", "Exercice")
            
            duels_data.append({
                "id": duel.get("id"),
                "from_user_id": player1_id,
                "from_user_name": from_user_name,
                "exercise_title": exercise_title,
                "created_at": duel.get("created_at")
            })
        
        return {"duels": duels_data}
    
    except Exception as e:
        logger.error(f"Error getting pending duels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/active")
async def get_active_duels(user: dict = Depends(verify_token)):
    """Get active duels for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duels where user is either player
        result = supabase.table("duels")\
            .select("*")\
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")\
            .execute()

        duels = result.data or []

        # Ensure finished duels are finalized server-side (timer)
        finalized_duels = []
        for duel in duels:
            finalized_duels.append(finalize_duel_if_needed(supabase, duel))

        # Return only active duels to keep previous behaviour for client
        active_duels = [d for d in finalized_duels if d.get("status") == "active"]
        return {"duels": active_duels}
    
    except Exception as e:
        logger.error(f"Error getting active duels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/history")
async def get_duel_history(user: dict = Depends(verify_token)):
    """Get finished duels history for current user. Must be declared before /api/duels/{duel_id} to avoid matching 'history' as duel_id."""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        result = (
            supabase.table("duels")
            .select("*")
            .eq("status", "finished")
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")
            .order("finished_at", desc=True)
            .limit(50)
            .execute()
        )

        duels = result.data or []

        opponent_ids: List[str] = []
        for d in duels:
            if d.get("player1_id") == user_id and d.get("player2_id"):
                opponent_ids.append(d["player2_id"])
            elif d.get("player2_id") == user_id and d.get("player1_id"):
                opponent_ids.append(d["player1_id"])

        profiles_map = {}
        if opponent_ids:
            profiles_result = (
                supabase.table("profiles")
                .select("id, first_name, last_name, email")
                .in_("id", opponent_ids)
                .execute()
            )
            profiles_map = {p["id"]: p for p in (profiles_result.data or [])}

        history_items = []
        for d in duels:
            if d.get("player1_id") == user_id:
                opponent_id = d.get("player2_id")
                my_score = d.get("player1_score") or 0
                opponent_score = d.get("player2_score") or 0
            else:
                opponent_id = d.get("player1_id")
                my_score = d.get("player2_score") or 0
                opponent_score = d.get("player1_score") or 0

            opponent_profile = profiles_map.get(opponent_id or "", {})
            email = opponent_profile.get("email", "") if opponent_profile else ""
            first_name = opponent_profile.get("first_name", "") if opponent_profile else ""
            last_name = opponent_profile.get("last_name", "") if opponent_profile else ""
            opponent_name = (
                f"{first_name} {last_name}".strip()
                or (email.split("@")[0] if email else "Adversaire")
            )

            result_label = "draw"
            if d.get("winner_id") == user_id:
                result_label = "win"
            elif d.get("winner_id") and d.get("winner_id") != user_id:
                result_label = "loss"

            history_items.append(
                {
                    "id": d.get("id"),
                    "opponent_id": opponent_id,
                    "opponent_name": opponent_name,
                    "my_score": my_score,
                    "opponent_score": opponent_score,
                    "result": result_label,
                    "created_at": d.get("created_at"),
                    "finished_at": d.get("finished_at"),
                }
            )

        return {"history": history_items}

    except Exception as e:
        logger.error(f"Error getting duel history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/config")
async def get_duel_config():
    """Public duel config: duration and exercise timeout. Single source of truth (edit backend/settings/duel_settings.py)."""
    return {
        "duelDurationSeconds": DUEL_DURATION_SECONDS,
        "exerciseTimeoutSeconds": DUEL_EXERCISE_TIMEOUT_SECONDS,
        "correctionDisplaySeconds": DUEL_CORRECTION_DISPLAY_SECONDS,
    }


@app.get("/api/duels/{duel_id}")
async def get_duel(duel_id: int, user: dict = Depends(verify_token)):
    """Get duel details"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]

        result = supabase.table("duels")\
            .select("*")\
            .eq("id", duel_id)\
            .execute()
        
        if not result.data:
            logger.info("[API] get_duel duel_id=%s user=%s -> 404 not found", duel_id, user_id[:8])
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel = result.data[0]
        p1 = duel.get("player1_id")
        p2 = duel.get("player2_id")
        is_player1 = p1 == user_id
        is_player2 = p2 == user_id

        if not is_player1 and not is_player2:
            logger.warning(
                "[API] get_duel duel_id=%s user=%s -> 403 (player1=%s player2=%s)",
                duel_id, user_id[:8], (p1 or "")[:8] if p1 else None, (p2 or "")[:8] if p2 else None,
            )
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à voir ce duel")

        # Log which side the requester is on (player1=creator, player2=accepter)
        logger.info(
            "[API] get_duel duel_id=%s user=%s -> 200 (player1=%s player2=%s)",
            duel_id, user_id[:8], is_player1, is_player2,
        )

        # Finalize duel if timer expired
        duel = finalize_duel_if_needed(supabase, duel)
        # If neither player scored within 30s, advance to next exercise
        duel = advance_duel_to_next_exercise_if_timeout(supabase, duel)
        
        # Get exercise if exercise_id exists
        if duel.get("exercise_id"):
            exercise_result = supabase.table("exercises")\
                .select("id, title, chapter, difficulty, content")\
                .eq("id", duel["exercise_id"])\
                .execute()
            if exercise_result.data:
                duel["exercise"] = exercise_result.data[0]
        
        # Get player1 profile
        if duel.get("player1_id"):
            player1_profile = supabase.table("profiles")\
                .select("id, first_name, last_name, email")\
                .eq("id", duel["player1_id"])\
                .execute()
            if player1_profile.data:
                duel["player1"] = {
                    "id": player1_profile.data[0]["id"],
                    "email": player1_profile.data[0].get("email", ""),
                    "profiles": [{
                        "first_name": player1_profile.data[0].get("first_name", ""),
                        "last_name": player1_profile.data[0].get("last_name", "")
                    }]
                }
        
        # Get player2 profile
        if duel.get("player2_id"):
            player2_profile = supabase.table("profiles")\
                .select("id, first_name, last_name, email")\
                .eq("id", duel["player2_id"])\
                .execute()
            if player2_profile.data:
                duel["player2"] = {
                    "id": player2_profile.data[0]["id"],
                    "email": player2_profile.data[0].get("email", ""),
                    "profiles": [{
                        "first_name": player2_profile.data[0].get("first_name", ""),
                        "last_name": player2_profile.data[0].get("last_name", "")
                    }]
                }
        
        return {"duel": duel}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# INT max for PostgreSQL; time_spent and cumulative times must not exceed this
_MAX_INT = 2_147_483_647
_MAX_TIME_SPENT_MS = 600_000  # 10 min per exercise


@app.post("/api/duels/{duel_id}/submit")
async def submit_duel_answer(duel_id: int, request: SubmitDuelAnswerRequest, user: dict = Depends(verify_token)):
    """Submit answer in a duel. time_spent is clamped by Pydantic to avoid INT overflow."""
    try:
        # request.time_spent is already clamped by SubmitDuelAnswerRequest validator
        time_spent_ms = request.time_spent
        logger.info(
            "[duel] submit_duel_answer duel_id=%s user=%s time_spent_ms=%s element_id=%s is_correct=%s",
            duel_id, user.get("user_id", "")[:8], time_spent_ms, request.element_id, request.is_correct,
        )

        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duel
        duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
        
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel_data = duel.data[0]

        # Finalize duel if timer expired
        duel_data = finalize_duel_if_needed(supabase, duel_data)
        # If neither player scored within 30s, advance to next exercise
        duel_data = advance_duel_to_next_exercise_if_timeout(supabase, duel_data)

        # If duel is already finished, we still record the attempt but do not change the score or exercise
        duel_finished = duel_data.get("status") == "finished"
        
        # Check if user is part of the duel
        if duel_data["player1_id"] != user_id and duel_data["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à soumettre une réponse pour ce duel")

        # Check BEFORE insert whether someone already solved this exercise (first correct gets the point)
        already_solved_before = False
        if request.is_correct:
            existing = (
                supabase.table("duel_attempts")
                .select("id")
                .eq("duel_id", duel_id)
                .eq("is_correct", True)
                .eq("element_id", request.element_id)
                .limit(1)
                .execute()
            )
            already_solved_before = bool(existing.data)
            logger.info("[duel] submit is_correct=True already_solved_before=%s", already_solved_before)
        
        attempt_data = {
            "duel_id": duel_id,
            "player_id": user_id,
            "element_id": request.element_id,
            "answer": request.answer,
            "is_correct": request.is_correct,
            "time_spent": time_spent_ms,
        }
        logger.info("[duel] insert duel_attempts payload time_spent=%s (type=%s)", attempt_data["time_spent"], type(attempt_data["time_spent"]).__name__)
        try:
            supabase.table("duel_attempts").insert(attempt_data).execute()
        except Exception as insert_err:
            logger.error(
                "[duel] duel_attempts INSERT failed: %s | payload=%s",
                insert_err, {k: v for k, v in attempt_data.items() if k != "answer"},
            )
            raise

        # If duel already finished because timer expired, do not update score or push new exercise
        if duel_finished:
            return {
                "message": "Duel terminé - réponse enregistrée mais hors temps",
                "correct": request.is_correct,
                "duel": duel_data,
            }
        
        # Update score if correct (only first correct for this exercise grants points)
        if request.is_correct:
            if already_solved_before:
                logger.info("[duel] correct but already_solved_before -> return current duel state")
                # Someone already solved this exercise; don't change score but return current duel state
                # (so frontend gets the next exercise, not stale duel_data from start of request)
                updated = supabase.table("duels").select("*").eq("id", duel_id).execute()
                duel_return = updated.data[0] if updated.data else duel_data
                if duel_return.get("exercise_id"):
                    ex_res = supabase.table("exercises").select("id, title, chapter, difficulty, content").eq("id", duel_return["exercise_id"]).execute()
                    if ex_res.data:
                        duel_return = {**duel_return, "exercise": ex_res.data[0]}
                return {
                    "message": "Réponse correcte mais l'exercice a déjà été résolu",
                    "correct": True,
                    "duel": duel_return,
                }

            logger.info("[duel] first correct for this exercise -> grant point and advance to next")
            is_player1 = duel_data["player1_id"] == user_id
            score_field = "player1_score" if is_player1 else "player2_score"
            time_field = "player1_time" if is_player1 else "player2_time"
            
            new_score = (duel_data.get(score_field) or 0) + 1
            current_time = duel_data.get(time_field) or 0
            try:
                current_time = int(current_time) if current_time is not None else 0
            except (TypeError, ValueError):
                current_time = 0
            if current_time < 0 or current_time > _MAX_INT:
                current_time = 0
            new_time = min(current_time + time_spent_ms, _MAX_INT)
            logger.info("[duel] update duels payload %s=%s %s=%s (current_time=%s time_spent_ms=%s)", score_field, new_score, time_field, new_time, current_time, time_spent_ms)

            # Pick next random exercise for the duel
            next_exercise, next_exercise_data = get_random_exercise_with_variables(
                supabase
            )
            if not next_exercise:
                # Fallback: keep current exercise but still update score
                update_payload = {
                    score_field: new_score,
                    time_field: new_time,
                }
            else:
                now_utc = datetime.utcnow().replace(tzinfo=timezone.utc)
                next_data = {**next_exercise_data, "started_at": now_utc.isoformat()}
                update_payload = {
                    score_field: new_score,
                    time_field: new_time,
                    "exercise_id": next_exercise["id"],
                    "exercise_data": next_data,
                }
            try:
                supabase.table("duels").update(update_payload).eq("id", duel_id).execute()
            except Exception as update_err:
                logger.error(
                    "[duel] duels UPDATE failed: %s | payload %s=%s %s=%s",
                    update_err, score_field, new_score, time_field, new_time,
                )
                raise
            
            # Get updated duel and attach exercise so client can show next exercise without another request
            updated_duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
            duel_return = updated_duel.data[0] if updated_duel.data else duel_data
            if duel_return.get("exercise_id"):
                ex_res = supabase.table("exercises").select("id, title, chapter, difficulty, content").eq("id", duel_return["exercise_id"]).execute()
                if ex_res.data:
                    duel_return["exercise"] = ex_res.data[0]
            return {
                "message": "Réponse enregistrée",
                "correct": True,
                "new_score": new_score,
                "duel": duel_return,
            }
        
        return {"message": "Réponse enregistrée", "correct": False}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error submitting answer (see above for which op failed): %s", e)
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement de la réponse.")


# ============================================
# HELPER FUNCTIONS
# ============================================


def advance_duel_to_next_exercise_if_timeout(supabase, duel: dict) -> dict:
    """
    If the current exercise has been shown for more than DUEL_EXERCISE_TIMEOUT_SECONDS
    and nobody has scored this round, pick a new random exercise and update the duel.
    """
    try:
        if not duel or duel.get("status") != "active":
            return duel
        exercise_data = duel.get("exercise_data") or {}
        started_at_str = exercise_data.get("started_at")
        if not started_at_str:
            return duel
        try:
            started_at = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
        except Exception:
            return duel
        now = datetime.now(timezone.utc)
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        elapsed = (now - started_at).total_seconds()
        if elapsed < DUEL_EXERCISE_TIMEOUT_SECONDS:
            return duel
        # Check if anyone scored (correct attempt) since this exercise started
        last_correct = (
            supabase.table("duel_attempts")
            .select("submitted_at")
            .eq("duel_id", duel["id"])
            .eq("is_correct", True)
            .order("submitted_at", desc=True)
            .limit(1)
            .execute()
        )
        if last_correct.data:
            try:
                last_at = datetime.fromisoformat(
                    last_correct.data[0]["submitted_at"].replace("Z", "+00:00")
                )
                if last_at.tzinfo is None:
                    last_at = last_at.replace(tzinfo=timezone.utc)
                if last_at >= started_at:
                    return duel
            except Exception:
                pass
        next_exercise, next_data = get_random_exercise_with_variables(supabase)
        if not next_exercise:
            return duel
        now_utc = datetime.utcnow().replace(tzinfo=timezone.utc)
        payload = {
            "exercise_id": next_exercise["id"],
            "exercise_data": {**next_data, "started_at": now_utc.isoformat()},
        }
        updated = (
            supabase.table("duels").update(payload).eq("id", duel["id"]).execute()
        )
        if updated.data:
            logger.info(
                "[duel] duel_id=%s exercise timeout 30s -> next exercise_id=%s",
                duel["id"],
                next_exercise["id"],
            )
            return updated.data[0]
    except Exception as e:
        logger.warning("advance_duel_to_next_exercise_if_timeout: %s", e)
    return duel


def _is_qcm_exercise(exercise_row: dict) -> bool:
    """True if exercise is a QCM (multiple choice). Excluded from duels."""
    title = (exercise_row.get("title") or "").upper()
    if "QCM" in title:
        return True
    content = exercise_row.get("content") or {}
    for el in content.get("elements") or []:
        if el.get("type") == "mcq":
            return True
    return False


def get_random_exercise_with_variables(supabase):
    """
    Pick a random exercise (excluding QCMs) and generate concrete variable values.
    Returns (exercise_row, exercise_data) where exercise_data contains the shared variables.
    """
    try:
        exercises = (
            supabase.table("exercises")
            .select("id, title, chapter, difficulty, content")
            .execute()
        )
        if not exercises.data:
            return None, None

        non_qcm = [e for e in exercises.data if not _is_qcm_exercise(e)]
        if not non_qcm:
            logger.warning("[duel] No non-QCM exercises available, using any exercise")
            non_qcm = exercises.data

        exercise_row = random.choice(non_qcm)
        content = exercise_row.get("content") or {}
        variables_config = content.get("variables", [])

        variable_values = {}
        for var in variables_config:
            try:
                vtype = var.get("type")
                name = var.get("name")
                if not name:
                    continue
                if vtype == "integer":
                    variable_values[name] = random.randint(
                        int(var.get("min", 0)), int(var.get("max", 10))
                    )
                elif vtype == "decimal":
                    decimals = int(var.get("decimals", 2))
                    value = random.uniform(
                        float(var.get("min", 0.0)), float(var.get("max", 1.0))
                    )
                    variable_values[name] = round(value, decimals)
            except Exception as var_error:
                logger.warning("Error generating variable for duel: %s", var_error)

        return exercise_row, {"variables": variable_values}
    except Exception as e:
        logger.error("Error picking random exercise for duel: %s", e)
        return None, None


def finalize_duel_if_needed(supabase, duel: dict) -> dict:
    """
    Ensure duel is marked as finished when the 3-minute timer is over.
    Returns the (possibly updated) duel dict.
    """
    try:
        if not duel:
            return duel

        if duel.get("status") != "active":
            return duel

        started_at_str = duel.get("started_at")
        if not started_at_str or duel.get("finished_at"):
            return duel

        # Parse ISO timestamp from Supabase (UTC)
        try:
            # Supabase returns ISO 8601 with timezone, e.g. "2026-03-04T12:34:56.789012+00:00"
            started_at = datetime.fromisoformat(started_at_str)
        except Exception:
            # Fallback: naive UTC
            started_at = datetime.strptime(started_at_str, "%Y-%m-%dT%H:%M:%S.%f")
            started_at = started_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        elapsed_seconds = (now - started_at).total_seconds()

        if elapsed_seconds < DUEL_DURATION_SECONDS:
            return duel

        # Timer is over: compute winner based on score
        p1_score = duel.get("player1_score") or 0
        p2_score = duel.get("player2_score") or 0

        winner_id = None
        if p1_score > p2_score:
            winner_id = duel.get("player1_id")
        elif p2_score > p1_score:
            winner_id = duel.get("player2_id")

        update_payload = {
            "status": "finished",
            "finished_at": now.isoformat(),
            "winner_id": winner_id,
        }

        updated = (
            supabase.table("duels")
            .update(update_payload)
            .eq("id", duel["id"])
            .execute()
        )
        if updated.data:
            return updated.data[0]
    except Exception as e:
        logger.error("Error finalizing duel timer: %s", e)

    return duel


def generate_unique_code(length: int = 8) -> str:
    """Generate a random alphanumeric code"""
    import string
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('I', '').replace('O', '').replace('0', '').replace('1', '')  # Remove ambiguous chars
    return ''.join(random.choice(chars) for _ in range(length))


if __name__ == "__main__":
    import uvicorn
    # Use import string for reload to work properly
    if settings.debug:
        uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
    else:
        uvicorn.run(app, host=settings.host, port=settings.port, reload=False)
