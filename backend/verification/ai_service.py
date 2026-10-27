
import os
import json
import logging
import re

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key)


def parse_json_response(response_text):
    """Parse Gemini's JSON response, including fenced JSON."""
    if not response_text:
        raise ValueError("Gemini returned an empty response.")

    text = response_text.strip()

    # Remove Markdown code fences if present.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # Recover a JSON object if extra text surrounds it.
        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end <= start:
            raise ValueError("Gemini did not return a JSON object.")

        result = json.loads(text[start:end + 1])

    required = {
        "completion_percentage",
        "covered_areas",
        "missing_areas",
        "feedback",
        "recommendation",
    }

    if not isinstance(result, dict) or not required.issubset(result):
        raise ValueError("Gemini response is missing required fields.")

    percentage = int(result["completion_percentage"])
    result["completion_percentage"] = max(0, min(100, percentage))

    for field in ("covered_areas", "missing_areas"):
        if not isinstance(result[field], list):
            raise ValueError(f"Invalid {field} in Gemini response.")

    for field in ("feedback", "recommendation"):
        result[field] = str(result[field])

    return result


def analyze_evidence(task, evidence_file):
    prompt = f"""
You are the AI verification system for VeriLearn.

Evaluate the submitted evidence against the student's own learning goal.

TASK TITLE:
{task.title}

TASK GOAL:
{task.description}

Return a JSON object with exactly these fields:
{{
  "completion_percentage": 0,
  "covered_areas": [],
  "missing_areas": [],
  "feedback": "",
  "recommendation": ""
}}

Rules:
- completion_percentage must be an integer from 0 to 100.
- covered_areas must list concepts clearly demonstrated by the evidence.
- missing_areas must list important concepts that are missing or incomplete.
- feedback must explain the score briefly.
- recommendation must suggest what to improve next.
- Evaluate dynamically against the task goal.
- Do not claim to prove who personally created the work.
- Do not make unsupported plagiarism claims.
- If evidence is unreadable or insufficient, explain that.
- Return valid JSON only. Do not include Markdown fences.
"""

    uploaded_file = client.files.upload(file=evidence_file.path)

    # Try the primary model first, then a lighter fallback if unavailable.
    models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
    last_error = None

    for model_name in models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[prompt, uploaded_file],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )

            result = parse_json_response(response.text)

            logger.info(
                "Evidence analysis succeeded using %s",
                model_name,
            )
            return result

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Evidence analysis failed using %s: %s",
                model_name,
                exc,
            )

    raise RuntimeError(
        "Gemini verification failed with all configured models. "
        "Please retry later."
    ) from last_error
