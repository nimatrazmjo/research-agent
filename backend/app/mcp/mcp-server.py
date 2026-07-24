from fastmcp import FastMCP, Context
from anthropic import AsyncAnthropic
from pydantic import BaseModel

mcp = FastMCP("Research Agent")
client = AsyncAnthropic()


class ResearchPlan(BaseModel):
    sub_questions: list[str]


@mcp.tool
async def generate_research_plan(question: str, ctx: Context) -> list[str]:
    """
    Generate a research plan for the given question.

    Args:
        question (str): The question to generate a research plan for.
    """
    await ctx.info(f"Received question: {question}")
    await ctx.report_progress(0, 3, "Starting")

    await ctx.info("Calling Claude for structured plan...")
    await ctx.report_progress(1, 3, "Generating sub-questions")

    response = await client.messages.parse(
        model="claude-sonnet-5",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": f"Generate a research plan for the following question: {question}"
            }
        ],
        output_format=ResearchPlan
    )

    await ctx.report_progress(2, 3, "Parsing response")
    sub_questions = response.parsed_output.sub_questions

    await ctx.info(f"Generated {len(sub_questions)} sub-questions")
    await ctx.report_progress(3, 3, "Done")

    return sub_questions


if __name__ == "__main__":
    mcp.run()
