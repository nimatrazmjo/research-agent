from anthropic import AsyncAnthropic
from fastapi import APIRouter, Depends

from app.dependencies import get_client
from app.schemas import ResearchPlan
from app.services import generate_plan

router = APIRouter(tags=["plan"])


@router.get("/plan")
async def plan(
    question: str,
    client: AsyncAnthropic = Depends(get_client),
) -> ResearchPlan:
    return await generate_plan(question, client)
