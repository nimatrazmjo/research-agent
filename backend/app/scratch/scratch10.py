# backend/app/mcp/scratch10.py — MCP connector, step 1
from anthropic import Anthropic

client = Anthropic()

"""
This is a simple example of how to use the FastMCP docs tool to deploy a FastMCP server to production.
{response}
"""

response = client.beta.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Using the FastMCP docs tool, how do I deploy a FastMCP server to production?",
    }],
    mcp_servers=[
        {
            "type": "url",
            "url": "https://gofastmcp.com/mcp",
            "name": "fastmcp-docs",
        }
    ],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "fastmcp-docs"}],
    betas=["mcp-client-2025-11-20"],
)

for block in response.content:
    print(block.type)
    if block.type == "mcp_tool_use":
        print("  called:", block.name, block.input)
    if block.type == "text":
        print(" ", block.text)
