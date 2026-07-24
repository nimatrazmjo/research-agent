from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ask_router, health_router, plan_router

_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]


def create_app() -> FastAPI:
    app = FastAPI(title="Research Agent API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(ask_router, prefix="/api")
    app.include_router(plan_router, prefix="/api")

    return app


app = create_app()
