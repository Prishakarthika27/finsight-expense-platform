from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, dashboard, charts, expenses, bills, statements, documents
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
app.include_router(charts.router)
app.include_router(expenses.router)
app.include_router(bills.router)
app.include_router(statements.router)
app.include_router(documents.router)

@app.get("/")
def root():
    return {"message": "FinSight API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}