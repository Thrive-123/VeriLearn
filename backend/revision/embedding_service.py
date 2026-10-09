
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key)


def generate_embedding(text):
    """Convert learning text into a numerical embedding."""
    if not text or not text.strip():
        return []

    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text.strip(),
    )

    if not response.embeddings:
        return []

    return response.embeddings[0].values
