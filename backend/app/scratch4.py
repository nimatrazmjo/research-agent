# backend/app/scratch4.py — real web search, step 1
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "What are the latest developments in solid-state batteries in 2026?",
    }],
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
)

for block in response.content:
    print(block.type)
    if block.type == "text":
        print(block.text)
        if block.citations:
            for c in block.citations:
                print("  cited:", c.url)
