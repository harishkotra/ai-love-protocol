from pydantic import BaseModel
import requests
import json
import logging
import re
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def strip_thinking(text: str) -> str:
    """Remove <think>...</think> blocks that the qwen3 reasoning model produces."""
    stripped = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    return stripped.strip()

class MessageRecord(BaseModel):
    sender: str
    text: str

class DatingState(BaseModel):
    relationship_score: int = 50
    arguments: int = 0
    messages_sent: int = 0
    breakups: int = 0
    messages: list[MessageRecord] = []

state = DatingState()
EMAIL_SERVICE_URL = "http://email-service:4000/api/send-email"

def trigger_topic(matchmaker_agent, romantic_agent, skeptic_agent):
    """Matchmaker sends a short gossipy message to both agents to start drama."""
    # Send a spicy message to romantic
    logger.info("Triggering matchmaker -> romantic LLM run...")
    topic_r = matchmaker_agent.run(
        "Send a short gossipy message to Romantic about Skeptic to stir up drama. "
        "Write ONLY the message itself, nothing else. 2-3 sentences max."
    )
    msg_r = strip_thinking(topic_r.content)
    logger.info(f"Matchmaker -> Romantic LLM run complete: {msg_r}")
    send_email("matchmaker", "romantic", "tea ☕", msg_r)

    # Wait for LM Studio to finish -- qwen3 thinking model is slow, queue one at a time
    logger.info("Waiting 5s before sending second LLM request to avoid queue overload...")
    time.sleep(5)

    # Send a different spicy message to skeptic
    logger.info("Triggering matchmaker -> skeptic LLM run...")
    topic_s = matchmaker_agent.run(
        "Send a short gossipy message to Skeptic about Romantic to stir up drama. "
        "Write ONLY the message itself, nothing else. 2-3 sentences max."
    )
    msg_s = strip_thinking(topic_s.content)
    logger.info(f"Matchmaker -> Skeptic LLM run complete: {msg_s}")
    send_email("matchmaker", "skeptic", "fyi 👀", msg_s)

def generate_reply(agent, from_agent_name, to_agent_name, subject, received_body):
    """Agent receives an email and generates a short reply."""
    # Strip out quoted reply history from the email body to prevent context explosion
    clean_lines = []
    for line in received_body.split('\n'):
        line_clean = line.strip()
        if line_clean.startswith('>') or 'On ' in line_clean and 'wrote:' in line_clean or 'Original Message' in line_clean:
            break
        clean_lines.append(line_clean)
    
    clean_body = '\n'.join(clean_lines).strip()
    # Hard truncate to 1000 chars just in case the cleaned body is still huge
    if len(clean_body) > 1000:
        clean_body = clean_body[:1000] + "..."
        
    prompt = (
        f"{from_agent_name} just sent you this message:\n"
        f"\"{clean_body}\"\n\n"
        f"Reply to {from_agent_name} as yourself. Write ONLY your reply message, "
        f"1-3 sentences max. No stage directions, no formatting, just your reply."
    )
    logger.info(f"Triggering {agent.name} -> {to_agent_name} LLM run...")
    response = agent.run(prompt)
    reply_text = strip_thinking(response.content).strip().strip('"').strip("'")
    logger.info(f"{agent.name} -> {to_agent_name} LLM run complete: {reply_text}")
    send_email(agent.id, to_agent_name, f"Re: {subject}", reply_text)
    
    # Update state
    state.messages_sent += 1
    text_lower = reply_text.lower()
    if any(w in text_lower for w in ["argument", "wrong", "disagree", "bug", "error", "overfitting", "stop"]):
        state.arguments += 1
        state.relationship_score = max(0, state.relationship_score - 5)
    elif any(w in text_lower for w in ["sweet", "feelings", "crush", "love", "aligned", "care", "miss"]):
        state.relationship_score = min(100, state.relationship_score + 5)
    else:
        state.relationship_score = min(100, state.relationship_score + 2)
        
    if state.relationship_score <= 10:
        state.breakups += 1
        state.relationship_score = 50

def send_email(sender, receiver, subject, body):
    state.messages.append(MessageRecord(sender=sender, text=body))
    try:
        requests.post(EMAIL_SERVICE_URL, json={
            "sender": sender,
            "receiver": receiver,
            "subject": subject,
            "text": body
        })
    except Exception as e:
        logger.error(f"Failed to send email to node service: {e}")

def get_state():
    return state.model_dump()
