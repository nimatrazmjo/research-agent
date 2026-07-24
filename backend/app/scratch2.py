from anthropic import Anthropic
from pydantic import BaseModel


class ResearchPlan(BaseModel):
    sub_questions: list[str]


client = Anthropic()

response = client.messages.parse(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Break down this research question into 3-5 sub-questions: What is the state of solid-state batteries in 2026?",
    }],
    output_format=ResearchPlan,
)


print(response.parsed_output)
print(type(response.parsed_output))
