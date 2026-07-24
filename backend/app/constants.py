MODEL = "claude-sonnet-5"
MAX_TOKENS = 4096
PLAN_MAX_TOKENS = 1024

RESEARCH_SYSTEM_PROMPT = [
    {
        "type": "text",
        "text": (
            "You are a research assistant that breaks down complex research "
            "questions into clear, well-scoped sub-questions suitable for "
            "independent investigation."
        ),
        "cache_control": {"type": "ephemeral"},
    }
]
