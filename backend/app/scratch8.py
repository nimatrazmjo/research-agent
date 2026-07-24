from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-5",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": "Search for the latest news on solid-state batteries, then search separately for the latest news on EV charging infrastructure, and summarize both.",
    }],
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
    betas=["context-management-2025-06-27"],
    context_management={
        "edits": [
            {
                "type": "clear_tool_uses_20250919",
                # artificially low, just to see it fire
                "trigger": {"type": "tool_uses", "value": 1},
                "keep": {"type": "tool_uses", "value": 1},
            }
        ]
    },
)

print(response.context_management)
