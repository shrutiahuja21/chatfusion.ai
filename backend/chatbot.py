import json
import os
import time
import difflib
from dotenv import load_dotenv
from logger import logger
from database import SessionLocal, ConversationLog

# Load environment variables (kept for potential future use or DB config)
load_dotenv(override=True)

# FAQ Knowledge Base
FAQ_KB = {
    "what is chatfusion.ai": "ChatFusion.ai is an AI-powered platform designed to help businesses automate conversations, improve customer support, and enhance user engagement.",
    "how do i create an account": "Click on the “Sign Up” button on the homepage, enter your details, and follow the verification steps to get started.",
    "is there a free trial available": "Yes, ChatFusion.ai offers a free trial so you can explore its features before upgrading to a premium plan.",
    "how can i reset my password": "Go to the login page, click “Forgot Password,” and follow the instructions sent to your registered email.",
    "what payment methods are accepted": "We accept major credit/debit cards and selected online payment methods depending on your region.",
    "can i upgrade or downgrade my plan anytime": "Yes, you can change your subscription plan anytime from your account settings.",
    "how do i contact support": "You can reach out through the in-app chat or email support, and our team will assist you promptly.",
    "is my data safe": "Yes, we use industry-standard security measures to keep your data safe and protected.",
    "is my data सुरक्षित": "Yes, we use industry-standard security measures to keep your data safe and protected."
}

ESCALATION_KEYWORDS = ["human", "agent", "live person", "support team", "talk to someone", "representative"]

def get_local_response(text: str):
    """
    Local NLP logic to find the best matching answer from the FAQ KB.
    """
    text_lower = text.lower().strip()
    
    # 1. Check for escalation intent
    if any(keyword in text_lower for keyword in ESCALATION_KEYWORDS):
        return "[ESCALATE] I am connecting you with a live support agent who can assist you further. Please wait a moment.", True

    # 2. Find best match in FAQ
    questions = list(FAQ_KB.keys())
    matches = difflib.get_close_matches(text_lower, questions, n=1, cutoff=0.4)
    
    if matches:
        return FAQ_KB[matches[0]], False
    
    # 3. Default fallback response
    return "I'm sorry, I couldn't find a specific answer to that in our knowledge base. You can try asking about our features, how to sign up, or request a human agent for more help.", False

def stream_message(user_id: str, channel: str, text: str):
    """
    Process incoming user text using local NLP logic, simulating a streaming response.
    It yields Server-Sent Events (SSE) that Next.js can read in real time.
    Also logs the conversation to the database.
    """
    logger.info(f"Initiating Local NLP processing for query: {text}")
    
    try:
        response_text, is_escalated = get_local_response(text)
        buffer = ""
        
        # Simulate streaming by yielding chunks of the response
        # This keeps the frontend UI experience smooth
        words = response_text.split(" ")
        
        for i, word in enumerate(words):
            content = word + (" " if i < len(words) - 1 else "")
            buffer += content
            
            # Check for escalation marker at the very start (local NLP prepends it)
            if "[ESCALATE]" in buffer and i == 0:
                yield f"data: {json.dumps({'type': 'intent', 'value': 'request_human'})}\n\n"
                # Remove marker for display
                display_content = content.replace("[ESCALATE]", "").strip()
                if display_content:
                    yield f"data: {json.dumps({'type': 'content', 'value': display_content + ' '})}\n\n"
                continue
            
            yield f"data: {json.dumps({'type': 'content', 'value': content})}\n\n"
            time.sleep(0.05) # Small delay to simulate "thinking" and typing
        
        # Send intent
        intent = "request_human" if is_escalated else "general_query"
        yield f"data: {json.dumps({'type': 'intent', 'value': intent})}\n\n"
             
        yield "data: [DONE]\n\n"
        logger.info(f"Local NLP processing finished. Intent: {intent}. Saving to database.")

        # Save to Database
        db_session = SessionLocal()
        try:
            log_entry = ConversationLog(
                user_id=user_id,
                channel=channel,
                user_message=text,
                bot_response=buffer.replace("[ESCALATE]", "").strip(),
                intent_detected=intent,
                confidence=0.9 if not is_escalated else 1.0,
                escalated_to_agent=is_escalated
            )
            db_session.add(log_entry)
            db_session.commit()
        except Exception as db_e:
            logger.error(f"Failed to save conversation to DB: {db_e}")
            db_session.rollback()
        finally:
            db_session.close()

    except Exception as e:
        logger.error(f"Local NLP Error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'value': 'I encountered an issue processing your request.'})}\n\n"
        yield "data: [DONE]\n\n"
