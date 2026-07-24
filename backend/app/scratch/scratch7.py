from anthropic import Anthropic
from anthropic.tools import BetaLocalFilesystemMemoryTool


client = Anthropic()
memory = BetaLocalFilesystemMemoryTool(base_path="./memory")

# "Conversation 1" — tell it something
runner1 = client.beta.messages.tool_runner(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "Remember that my research project is about solid-state batteries, and I'm most interested in commercialization timelines, not the underlying chemistry.",
    }],
    tools=[memory],
)
print(runner1.until_done().content[-1].text)


# "Conversation 2" — brand new messages list, same memory directory
runner2 = client.beta.messages.tool_runner(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What do you remember about my research project?"}],
    tools=[memory],
)
print(runner2.until_done().content[-1].text)
