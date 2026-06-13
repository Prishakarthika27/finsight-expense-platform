from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import create_client, Client
from app.config import get_settings
from app.models.profile import ProfileResponse, ProfileUpdate
from app.routers.dashboard import get_user_id

router = APIRouter(prefix="/profile", tags=["Profile"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("", response_model=ProfileResponse)
def get_profile(
    user_id: str = Depends(get_user_id),
    authorization: str = Header(...),
):
    supabase = get_supabase_client()

    profile_response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profile_response.data[0]

    # Get email from auth
    token = authorization.replace("Bearer ", "")
    anon_client = create_client(settings.supabase_url, settings.supabase_anon_key)
    user_response = anon_client.auth.get_user(token)
    email = user_response.user.email if user_response.user else None

    return ProfileResponse(
        id=profile["id"],
        full_name=profile["full_name"],
        avatar_url=profile.get("avatar_url"),
        email=email,
        created_at=profile["created_at"],
    )


@router.put("", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    user_id: str = Depends(get_user_id),
    authorization: str = Header(...),
):
    supabase = get_supabase_client()

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = response.data[0]

    token = authorization.replace("Bearer ", "")
    anon_client = create_client(settings.supabase_url, settings.supabase_anon_key)
    user_response = anon_client.auth.get_user(token)
    email = user_response.user.email if user_response.user else None

    return ProfileResponse(
        id=profile["id"],
        full_name=profile["full_name"],
        avatar_url=profile.get("avatar_url"),
        email=email,
        created_at=profile["created_at"],
    )