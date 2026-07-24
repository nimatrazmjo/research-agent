# backend/app/scratch9.py — compaction, wired but not expected to fire
from anthropic import Anthropic

client = Anthropic()

messages = [{"role": "user",
             "content": "What are the latest developments in solid-state batteries?"}]

response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=messages,
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
    context_management={"edits": [{"type": "compact_20260112"}]},
)

print(response.usage.iterations)
for block in response.content:
    if block.type == "text":
        print(block.text)
