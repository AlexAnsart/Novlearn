"""
API FastAPI pour Novlearn
Backend principal de l'application avec système de duels et amis
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
import random

from config import settings
from auth import verify_token, get_supabase_client

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    time_spent: int  # millisecondes


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
# FRIENDS ENDPOINTS
# ============================================

@app.get("/api/friends/code")
async def get_friend_code(user: dict = Depends(verify_token)):
    """Get or generate friend code for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Check if user already has a code
        result = supabase.table("friend_codes").select("*").eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            code = result.data[0]["code"]
        else:
            # Generate new code (should be handled by trigger, but fallback)
            code = generate_unique_code()
            supabase.table("friend_codes").insert({
                "user_id": user_id,
                "code": code
            }).execute()
        
        invite_link = f"https://novlearn.fr/invite/{code}"
        
        return FriendCodeResponse(code=code, invite_link=invite_link)
    
    except Exception as e:
        logger.error(f"Error getting friend code: {str(e)}")
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
        
        # Get friendships where user is either user1 or user2
        friends_data = []
        
        # Query as user1
        result1 = supabase.table("friends")\
            .select("*, user2:user2_id(id, email, profiles(first_name, last_name))")\
            .eq("user1_id", user_id)\
            .eq("status", "accepted")\
            .execute()
        
        for friend in result1.data or []:
            if friend.get("user2"):
                user_data = friend["user2"]
                profile = user_data.get("profiles", [{}])[0] if user_data.get("profiles") else {}
                friends_data.append({
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "first_name": profile.get("first_name", ""),
                    "last_name": profile.get("last_name", ""),
                    "name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or user_data.get("email", "").split("@")[0]
                })
        
        # Query as user2
        result2 = supabase.table("friends")\
            .select("*, user1:user1_id(id, email, profiles(first_name, last_name))")\
            .eq("user2_id", user_id)\
            .eq("status", "accepted")\
            .execute()
        
        for friend in result2.data or []:
            if friend.get("user1"):
                user_data = friend["user1"]
                profile = user_data.get("profiles", [{}])[0] if user_data.get("profiles") else {}
                friends_data.append({
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "first_name": profile.get("first_name", ""),
                    "last_name": profile.get("last_name", ""),
                    "name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or user_data.get("email", "").split("@")[0]
                })
        
        return {"friends": friends_data}
    
    except Exception as e:
        logger.error(f"Error getting friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/friends/requests")
async def get_friend_requests(user: dict = Depends(verify_token)):
    """Get pending friend requests for current user"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get requests where user is the recipient
        result = supabase.table("friend_requests")\
            .select("*, from_user:from_user_id(id, email, profiles(first_name, last_name))")\
            .eq("to_user_id", user_id)\
            .eq("status", "pending")\
            .execute()
        
        requests_data = []
        for req in result.data or []:
            if req.get("from_user"):
                user_data = req["from_user"]
                profile = user_data.get("profiles", [{}])[0] if user_data.get("profiles") else {}
                requests_data.append({
                    "id": req.get("id"),
                    "from_user_id": user_data.get("id"),
                    "from_user_name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or user_data.get("email", "").split("@")[0],
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
        
        # Get default exercise if none specified
        exercise_id = request.exercise_id
        if not exercise_id:
            # Get first available exercise
            exercises = supabase.table("exercises").select("id").limit(1).execute()
            if exercises.data:
                exercise_id = exercises.data[0]["id"]
            else:
                raise HTTPException(status_code=404, detail="Aucun exercice disponible")
        
        # Create duel
        duel_data = {
            "player1_id": user_id,
            "player2_id": request.friend_id,
            "exercise_id": exercise_id,
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
        
        # Update duel status
        update_data = {
            "status": "active",
            "started_at": datetime.utcnow().isoformat()
        }
        
        # Generate exercise variables if needed
        exercise = supabase.table("exercises").select("content").eq("id", duel_data["exercise_id"]).execute()
        if exercise.data:
            exercise_content = exercise.data[0]["content"]
            variables = exercise_content.get("variables", [])
            
            # Generate random values for variables
            variable_values = {}
            for var in variables:
                if var["type"] == "integer":
                    variable_values[var["name"]] = random.randint(var["min"], var["max"])
                elif var["type"] == "decimal":
                    variable_values[var["name"]] = round(random.uniform(var["min"], var["max"]), var.get("decimals", 2))
            
            update_data["exercise_data"] = {"variables": variable_values}
        
        result = supabase.table("duels").update(update_data).eq("id", duel_id).execute()
        
        return {"message": "Duel accepté", "duel": result.data[0]}
    
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
            .select("*, player1:player1_id(id, email, profiles(first_name, last_name)), exercise:exercise_id(title)")\
            .eq("player2_id", user_id)\
            .eq("status", "waiting")\
            .execute()
        
        duels_data = []
        for duel in result.data or []:
            if duel.get("player1"):
                user_data = duel["player1"]
                profile = user_data.get("profiles", [{}])[0] if user_data.get("profiles") else {}
                duels_data.append({
                    "id": duel.get("id"),
                    "from_user_id": user_data.get("id"),
                    "from_user_name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or user_data.get("email", "").split("@")[0],
                    "exercise_title": duel.get("exercise", {}).get("title", "Exercice"),
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
        
        # Get active duels where user is either player
        result = supabase.table("duels")\
            .select("*")\
            .eq("status", "active")\
            .or_(f"player1_id.eq.{user_id},player2_id.eq.{user_id}")\
            .execute()
        
        return {"duels": result.data or []}
    
    except Exception as e:
        logger.error(f"Error getting active duels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/duels/{duel_id}")
async def get_duel(duel_id: int, user: dict = Depends(verify_token)):
    """Get duel details"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        result = supabase.table("duels")\
            .select("*, exercise:exercise_id(id, title, chapter, difficulty, content), player1:player1_id(id, email, profiles(first_name, last_name)), player2:player2_id(id, email, profiles(first_name, last_name))")\
            .eq("id", duel_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel = result.data[0]
        
        # Check if user is part of the duel
        if duel["player1_id"] != user_id and duel["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à voir ce duel")
        
        return {"duel": duel}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting duel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/duels/{duel_id}/submit")
async def submit_duel_answer(duel_id: int, request: SubmitDuelAnswerRequest, user: dict = Depends(verify_token)):
    """Submit answer in a duel"""
    try:
        supabase = get_supabase_client()
        user_id = user["user_id"]
        
        # Get duel
        duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
        
        if not duel.data:
            raise HTTPException(status_code=404, detail="Duel introuvable")
        
        duel_data = duel.data[0]
        
        # Check if user is part of the duel
        if duel_data["player1_id"] != user_id and duel_data["player2_id"] != user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à soumettre une réponse pour ce duel")
        
        # Record attempt
        attempt_data = {
            "duel_id": duel_id,
            "player_id": user_id,
            "element_id": request.element_id,
            "answer": request.answer,
            "is_correct": request.is_correct,
            "time_spent": request.time_spent
        }
        
        supabase.table("duel_attempts").insert(attempt_data).execute()
        
        # Update score if correct
        if request.is_correct:
            is_player1 = duel_data["player1_id"] == user_id
            score_field = "player1_score" if is_player1 else "player2_score"
            time_field = "player1_time" if is_player1 else "player2_time"
            
            new_score = (duel_data[score_field] or 0) + 1
            current_time = duel_data[time_field] or 0
            new_time = current_time + request.time_spent
            
            supabase.table("duels").update({
                score_field: new_score,
                time_field: new_time
            }).eq("id", duel_id).execute()
            
            # Get updated duel
            updated_duel = supabase.table("duels").select("*").eq("id", duel_id).execute()
            
            return {
                "message": "Réponse enregistrée",
                "correct": True,
                "new_score": new_score,
                "duel": updated_duel.data[0] if updated_duel.data else duel_data
            }
        
        return {"message": "Réponse enregistrée", "correct": False}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_unique_code(length: int = 8) -> str:
    """Generate a random alphanumeric code"""
    import string
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('I', '').replace('O', '').replace('0', '').replace('1', '')  # Remove ambiguous chars
    return ''.join(random.choice(chars) for _ in range(length))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port, reload=settings.debug)
