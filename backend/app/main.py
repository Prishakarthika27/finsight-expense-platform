from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, dashboard

settings = get_settings()

app = FastAPI(
    title="FinSight API",
    description="AI-Powered Expense Intelligence Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "FinSight API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}