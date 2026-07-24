# backend/app/scratch5.py — web fetch, step 1
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Summarize the key findings from https://news.mit.edu/2026/discovery-helps-explain-why-solid-state-batteries-often-fail-0706",
    }],
    tools=[{
        "type": "web_fetch_20250910",
        "name": "web_fetch",
        "max_uses": 3,
        "citations": {"enabled": True},
    }],
)

for block in response.content:
    print(block.type)
    if block.type == "text":
        print(block.text)
        if block.citations:
            for c in block.citations:
                print("  cited:", c.cited_text[:80])
