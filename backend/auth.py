"""
Authentication utilities for Novlearn API
"""
from fastapi import HTTPException, Header
from supabase import create_client, Client
from config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy initialization of Supabase client
_supabase_client: Optional[Client] = None


def _get_supabase_client() -> Client:
    """
    Get or create Supabase client instance.
    Validates that required environment variables are set.
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url:
            raise ValueError(
                "SUPABASE_URL environment variable is not set. "
                "Please create a .env file in the backend directory with:\n"
                "SUPABASE_URL=https://your-project.supabase.co\n"
                "SUPABASE_SERVICE_KEY=your-service-key"
            )
        if not settings.supabase_service_key:
            raise ValueError(
                "SUPABASE_SERVICE_KEY environment variable is not set. "
                "Please create a .env file in the backend directory with:\n"
                "SUPABASE_URL=https://your-project.supabase.co\n"
                "SUPABASE_SERVICE_KEY=your-service-key"
            )
        
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
    
    return _supabase_client


async def verify_token(authorization: str = Header(None)) -> dict:
    """
    Verify JWT token from Supabase Auth
    Returns user data if valid, raises HTTPException if invalid
    """
    if not authorization:
        logger.warning("Missing authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1] if " " in authorization else authorization
        logger.info(f"Verifying token (length: {len(token)})")
        
        # Verify token with Supabase
        supabase = _get_supabase_client()
        logger.info("Calling supabase.auth.get_user()")
        response = supabase.auth.get_user(token)
        logger.info(f"get_user() response received: {response is not None}")
        
        if not response or not response.user:
            logger.warning("Invalid token: no user in response")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        logger.info(f"Token verified successfully for user: {response.user.id}")
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "user": response.user
        }
    
    except IndexError:
        logger.error("Invalid authorization header format")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return _get_supabase_client()
