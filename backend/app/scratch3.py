from anthropic import Anthropic, beta_tool

client = Anthropic()


@beta_tool
def get_weather(city: str) -> str:
    """Get the current weather for a city.

    Args:
        city: The city name
    """
    return f"It's 72F and sunny in {city}."


runner = client.beta.messages.tool_runner(
    model="claude-sonnet-5",
    max_tokens=1024,
    tools=[get_weather],
    messages=[
        {"role": "user", "content": "What's the weather in Paris and in Tokyo?"}],
)

final_text = None
for message in runner:
    tool_calls = [b for b in message.content if b.type == "tool_use"]
    if tool_calls:
        print(
            f"round trip requested {len(tool_calls)} tool call(s): {[b.input for b in tool_calls]}")
    else:
        final_text = next(b.text for b in message.content if b.type == "text")

print(final_text)
