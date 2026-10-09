import os
import json

from dotenv import load_dotenv
from google import genai


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key)


def analyze_evidence(task, evidence_file):

    prompt = f"""
You are the AI verification system for VeriLearn.

A student created the following learning task:

TASK TITLE:
{task.title}

TASK GOAL:
{task.description}

The student has submitted the attached evidence as proof of their work.

Analyze the evidence against the student's own task goal.

Do NOT assume a fixed syllabus or fixed checklist.
Determine dynamically what concepts, requirements, or outcomes are necessary
to consider the student's task completed.

Evaluate only what can reasonably be demonstrated by the submitted evidence.

Return ONLY valid JSON in exactly this structure:

{{
    "completion_percentage": 0,
    "covered_areas": [],
    "missing_areas": [],
    "feedback": "",
    "recommendation": ""
}}

Rules:

- completion_percentage must be an integer from 0 to 100.
- covered_areas must contain areas clearly demonstrated in the evidence.
- missing_areas must contain important parts of the student's task that are
  missing, incomplete, or insufficiently demonstrated.
- feedback must briefly explain why the evidence received this percentage.
- recommendation must tell the student what to learn, revise, complete,
  or improve next.
- Do not claim that you can prove the student personally created the work.
- Do not make unsupported claims about plagiarism or copying.
- If the evidence is insufficient to evaluate the task, say so in the
  feedback and recommendation.
"""


    uploaded_file = client.files.upload(
        file=evidence_file.path
    )


    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            uploaded_file,
        ],
    )


    response_text = response.text.strip()


    if response_text.startswith("```"):
        response_text = response_text.replace("```json", "")
        response_text = response_text.replace("```", "")
        response_text = response_text.strip()


    result = json.loads(response_text)

    return result