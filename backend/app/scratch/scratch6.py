# backend/app/scratch6.py — code execution, step 1
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Use code execution to count how many times the letter 'r' appears in 'strawberry', and show your work.",
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
)

for block in response.content:
    print(block.type)
    if block.type == "server_tool_use":
        print("  command:", block.input)
    if block.type == "bash_code_execution_tool_result":
        print("  stdout:", block.content.stdout)
    if block.type == "text":
        print(" ", block.text)
