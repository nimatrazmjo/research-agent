import asyncio
import os
from pathlib import Path
from fastmcp import Client
from fastmcp.client.transports import StdioTransport

SERVER_PATH = Path(__file__).parent / "mcp-server.py"

transport = StdioTransport(
    command="python3",
    args=[str(SERVER_PATH)],
    env={"ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"]},
)


async def log_handler(message) -> None:
    print(f"[{message.level.upper()}] {message.data}")


async def progress_handler(progress: float, total: float | None, message: str | None) -> None:
    if total:
        pct = int(progress / total * 100)
        bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
        label = f" {message}" if message else ""
        print(f"[PROGRESS] [{bar}] {pct}%{label}")
    else:
        print(f"[PROGRESS] {progress}{f' {message}' if message else ''}")


async def main():
    async with Client(
        transport,
        log_handler=log_handler,
        progress_handler=progress_handler,
    ) as client:
        tools = await client.list_tools()
        print("tools:", [t.name for t in tools])

        result = await client.call_tool(
            "generate_research_plan",
            {"question": "What was the referee rules in WC 2026?"},
        )
        print("result:", result.data)

asyncio.run(main())
