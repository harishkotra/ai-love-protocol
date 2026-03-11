import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from agno.os import AgentOS
from pydantic import BaseModel
import threading
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from agents.matchmaker import matchmaker
from agents.romantic import romantic
from agents.skeptic import skeptic
from workflows.dating_engine import generate_reply, trigger_topic, get_state, state

app = FastAPI(title="AI Love Protocol - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_os = AgentOS(
    agents=[matchmaker, romantic, skeptic],
    base_app=app
)

os_app = agent_os.get_app()

# Global lock — LM Studio can only process ONE request at a time
# Without this, concurrent calls from drama_loop + webhook + /start all queue up and time out
llm_lock = threading.Lock()

class EmailWebhook(BaseModel):
    sender: str
    receiver: str
    subject: str
    text: str

@os_app.post("/webhook/email")
async def receive_email(webhook: EmailWebhook):
    """
    Routing rules:
    - Romantic ALWAYS replies to Skeptic (the dating partner)
    - Skeptic ALWAYS replies to Romantic (the dating partner)
    - Matchmaker receiving mail = ignored (matchmaker only initiates)
    """
    logger.info(f"Webhook: {webhook.sender} -> {webhook.receiver}: {webhook.subject}")

    def process_reply():
        with llm_lock:
            try:
                if webhook.receiver == "romantic":
                    generate_reply(romantic, webhook.sender, "skeptic", webhook.subject, webhook.text)
                elif webhook.receiver == "skeptic":
                    generate_reply(skeptic, webhook.sender, "romantic", webhook.subject, webhook.text)
                elif webhook.receiver == "matchmaker":
                    logger.info("Matchmaker received a reply, ignoring (matchmaker only initiates)")
            except Exception as e:
                logger.error(f"Error processing webhook: {e}")

    # Run reply generation in background thread so webhook returns immediately
    threading.Thread(target=process_reply, daemon=True).start()
    return {"status": "ok"}

@os_app.get("/state")
async def get_dating_state():
    return get_state()

@os_app.get("/test-llm")
async def test_llm():
    """Diagnostic endpoint to test LM studio connection."""
    try:
        logger.info("Testing LLM connection...")
        with llm_lock:
            response = matchmaker.run("Reply with just the word: OK")
        from workflows.dating_engine import strip_thinking
        return {"status": "success", "response": strip_thinking(response.content)}
    except Exception as e:
        logger.error(f"LLM Connection failed: {e}")
        return {"status": "error", "message": str(e)}

drama_running = False

def drama_loop():
    """Background loop that has matchmaker stir drama every 90 seconds."""
    global drama_running
    while drama_running:
        time.sleep(90)
        if drama_running:
            logger.info("Matchmaker stirring more drama...")
            with llm_lock:
                try:
                    trigger_topic(matchmaker, romantic, skeptic)
                except Exception as e:
                    logger.error(f"Error in drama loop: {e}")

@os_app.post("/start")
async def start_experiment():
    global drama_running
    
    # Reset state on start
    state.messages = []
    state.messages_sent = 0
    state.arguments = 0
    state.relationship_score = 50

    def initial_trigger():
        logger.info("Starting initial drama trigger...")
        with llm_lock:
            try:
                trigger_topic(matchmaker, romantic, skeptic)
            except Exception as e:
                logger.error(f"Error starting drama: {e}")

    # Run the first trigger in the background so the HTTP request returns instantly
    threading.Thread(target=initial_trigger, daemon=True).start()

    if not drama_running:
        drama_running = True
        t = threading.Thread(target=drama_loop, daemon=True)
        t.start()
    return {"status": "started"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:os_app", host="0.0.0.0", port=8000, reload=True)
