from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.analytics import (
    dashboard_router,
)
from app.api.v1.endpoints.analytics import (
    router as analytics_router,
)
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.campaign_stats import router as campaign_stats_router
from app.api.v1.endpoints.campaigns import router as campaigns_router

app = FastAPI(
    title="FLY Analytics API",
    description="Analytics platform for media buyers",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"^https://.*\.app\.github\.dev$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(campaigns_router, prefix="/api/v1")
app.include_router(campaign_stats_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "fly-analytics-api",
        "version": "0.1.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to FLY Analytics API",
        "docs": "/docs",
    }
