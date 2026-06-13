from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from app.config import get_settings
from app.models.document import DocumentResponse
from app.routers.dashboard import get_user_id
from typing import List

router = APIRouter(prefix="/documents", tags=["Documents"])

settings = get_settings()


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# Map file_type to the storage bucket it was uploaded to
BUCKET_MAP = {
    "bill": "receipts",
    "statement": "statements",
    "signed_document": "documents",
    "other": "documents",
}


@router.get("", response_model=List[DocumentResponse])
def list_documents(user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.get("/{document_id}/download")
def get_download_url(document_id: str, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    doc_response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = doc_response.data[0]
    bucket = BUCKET_MAP.get(document["file_type"], "documents")
    file_path = document["file_url"]

    # If file_url is already a full public URL (older receipts), return as-is
    if file_path.startswith("http"):
        return {"url": file_path}

    # Generate signed URL valid for 1 hour
    signed = supabase.storage.from_(bucket).create_signed_url(file_path, 3600)
    return {"url": signed["signedURL"]}


@router.delete("/{document_id}")
def delete_document(document_id: str, user_id: str = Depends(get_user_id)):
    supabase = get_supabase_client()

    doc_response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = doc_response.data[0]
    bucket = BUCKET_MAP.get(document["file_type"], "documents")
    file_path = document["file_url"]

    # Delete from storage if it's a storage path (not a full URL)
    if not file_path.startswith("http"):
        try:
            supabase.storage.from_(bucket).remove([file_path])
        except Exception:
            pass

    supabase.table("documents").delete().eq("id", document_id).eq("user_id", user_id).execute()
    return {"message": "Document deleted successfully"}