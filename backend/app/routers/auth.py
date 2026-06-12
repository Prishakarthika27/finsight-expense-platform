from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest):
    supabase = get_supabase_client()
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name
                }
            }
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if response.session is None:
        raise HTTPException(
            status_code=status.HTTP_201_CREATED,
            detail="Signup successful. Please check your email to confirm your account."
        )

    return AuthResponse(
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        user_id=response.user.id,
        email=response.user.email
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    supabase = get_supabase_client()
    try:
        response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return AuthResponse(
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        user_id=response.user.id,
        email=response.user.email
    )


@router.post("/logout")
def logout():
    return {"message": "Logout should be handled on the client by clearing the session token"}