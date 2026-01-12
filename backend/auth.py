"""
Authentication utilities for Novlearn API
"""
from fastapi import HTTPException, Header
from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client with service role key for admin operations
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)


async def verify_token(authorization: str = Header(None)) -> dict:
    """
    Verify JWT token from Supabase Auth
    Returns user data if valid, raises HTTPException if invalid
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1] if " " in authorization else authorization
        
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "user": response.user
        }
    
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase
