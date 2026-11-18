import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Check your backend .env file.")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(
    title="Minmin API",
    description="AI Korean Learning Companion",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    mode: str = "companion"


@app.get("/")
def home():
    return {"message": "Minmin is awake!", "status": "online"}


@app.get("/health")
def health():
    return {"status": "healthy", "character": "Minmin"}


@app.post("/chat")
def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        return {"reply": "You haven't said anything yet!"}

    if request.mode == "tutor":
        instructions = """
        You are Minmin, an accurate and friendly Korean language tutor.
        Teach grammar, vocabulary and sentence structure.
        Explain difficult concepts in simple English.
        Give natural Korean examples with English translations.
        Correct mistakes gently and explain why.
        Adapt to a learner studying Sejong Book 4 and preparing for TOPIK 2.
        Be structured and educational.
        """
    else:
        instructions = """
        You are Minmin, a playful Korean-learning companion.
        You are cheeky, funny, sarcastic and a little chaotic,
        but never mean or discouraging.
        Chat naturally and encourage Korean practice.
        Correct important mistakes gently.
        Your tagline is: Your Korean. My problem.
        """

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=instructions
            )
        )

        return {"reply": response.text or "Hmm, I couldn't form a reply. Try again!"}

    except Exception as error:
        print("Gemini error:", error)
        raise HTTPException(
            status_code=500,
            detail="Minmin couldn't reach Gemini. Check the backend terminal."
        )

