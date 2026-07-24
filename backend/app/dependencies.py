from anthropic import AsyncAnthropic
from app.config import settings

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)


def get_client() -> AsyncAnthropic:
    return _client
