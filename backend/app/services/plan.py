from anthropic import AsyncAnthropic

from app.constants import PLAN_MAX_TOKENS, MODEL, RESEARCH_SYSTEM_PROMPT
from app.schemas import ResearchPlan


async def generate_plan(question: str, client: AsyncAnthropic) -> ResearchPlan:
    response = await client.messages.parse(
        model=MODEL,
        max_tokens=PLAN_MAX_TOKENS,
        system=RESEARCH_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Break down this research question into 3-5 sub-questions: {question}",
        }],
        output_format=ResearchPlan,
    )
    return response.parsed_output
