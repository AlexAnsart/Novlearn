"""
Tests pour auth.verify_token (backend/auth.py).

Couvre :
  - Header Authorization absent → 401
  - Token Bearer valide → retourne user_id + email
  - Token sans préfixe "Bearer" → accepté
  - Réponse Supabase sans user → 401
  - Exception Supabase → 401
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException


@pytest.fixture(autouse=True)
def reset_singleton():
    """Réinitialise le singleton _supabase_client entre chaque test."""
    import auth
    auth._supabase_client = None
    yield
    auth._supabase_client = None


class TestVerifyToken:

    @pytest.mark.asyncio
    async def test_missing_header_raises_401(self):
        from auth import verify_token
        with pytest.raises(HTTPException) as exc:
            await verify_token(authorization=None)
        assert exc.value.status_code == 401
        assert "Missing" in exc.value.detail

    @pytest.mark.asyncio
    async def test_valid_bearer_token_returns_user(self):
        from auth import verify_token

        mock_user = MagicMock()
        mock_user.id = "uid-abc"
        mock_user.email = "alice@novlearn.fr"
        mock_response = MagicMock()
        mock_response.user = mock_user

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.return_value = mock_response
            mock_get.return_value = mock_client

            result = await verify_token(authorization="Bearer valid-jwt-token")

        assert result["user_id"] == "uid-abc"
        assert result["email"] == "alice@novlearn.fr"
        assert "user" in result

    @pytest.mark.asyncio
    async def test_token_without_bearer_prefix(self):
        """Un token sans 'Bearer ' est quand même traité."""
        from auth import verify_token

        mock_user = MagicMock()
        mock_user.id = "uid-xyz"
        mock_user.email = "bob@novlearn.fr"
        mock_response = MagicMock()
        mock_response.user = mock_user

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.return_value = mock_response
            mock_get.return_value = mock_client

            result = await verify_token(authorization="raw-token-no-prefix")

        assert result["user_id"] == "uid-xyz"

    @pytest.mark.asyncio
    async def test_supabase_returns_no_user_raises_401(self):
        from auth import verify_token

        mock_response = MagicMock()
        mock_response.user = None

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.return_value = mock_response
            mock_get.return_value = mock_client

            with pytest.raises(HTTPException) as exc:
                await verify_token(authorization="Bearer bad-token")

        assert exc.value.status_code == 401
        assert "Invalid token" in exc.value.detail

    @pytest.mark.asyncio
    async def test_supabase_exception_raises_401(self):
        from auth import verify_token

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.side_effect = RuntimeError("network error")
            mock_get.return_value = mock_client

            with pytest.raises(HTTPException) as exc:
                await verify_token(authorization="Bearer some-token")

        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_response_is_none_raises_401(self):
        from auth import verify_token

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.return_value = None
            mock_get.return_value = mock_client

            with pytest.raises(HTTPException) as exc:
                await verify_token(authorization="Bearer token")

        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_token_extraction_from_bearer_header(self):
        """Vérifie que seul le token (sans 'Bearer ') est passé à Supabase."""
        from auth import verify_token

        mock_user = MagicMock()
        mock_user.id = "u1"
        mock_user.email = "u@u.com"
        mock_response = MagicMock()
        mock_response.user = mock_user

        with patch("auth._get_supabase_client") as mock_get:
            mock_client = MagicMock()
            mock_client.auth.get_user.return_value = mock_response
            mock_get.return_value = mock_client

            await verify_token(authorization="Bearer my-actual-token")

        called_with = mock_client.auth.get_user.call_args[0][0]
        assert called_with == "my-actual-token"
        assert "Bearer" not in called_with
