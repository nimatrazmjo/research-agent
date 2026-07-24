from pydantic import BaseModel


class ResearchPlan(BaseModel):
    sub_questions: list[str]
