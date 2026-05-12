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
    "what are your business hours": "We are open Monday to Friday, 9 AM – 6 PM IST. On weekends we operate from 10 AM – 4 PM.",
    "how can i contact customer support": "You can reach us via live chat, email at support@company.com, or call us at 1800-XXX-XXXX (toll-free).",
    "i want to speak to a human agent": "Sure! I'm connecting you to a live agent. Please hold for a moment.",
    "what is your refund policy": "We offer a 30-day full refund policy on all products. Items must be unused and in original packaging.",
    "can i cancel my subscription": "Yes, you can cancel anytime from your account dashboard under 'Subscriptions'. No cancellation fee applies.",
    "how do i reset my password": "Click 'Forgot Password' on the login page and enter your registered email. You'll receive a reset link within 2 minutes.",
    "do you offer a free trial": "Yes! We offer a 14-day free trial with full access to all features. No credit card required.",
    "is my data secure with you": "Absolutely. We use AES-256 encryption and comply with GDPR & ISO 27001 standards to protect your data.",
    "what payment methods do you accept": "We accept Visa, Mastercard, UPI, Net Banking, PayPal, and EMI options.",
    "can i upgrade my plan": "Yes! Go to Settings > Subscription > Upgrade Plan to choose a new tier. Changes apply immediately.",
    "thank you that was helpful": "You're welcome! Is there anything else I can assist you with today?",
    "this is frustrating nothing is working": "I sincerely apologize for the inconvenience. Let me escalate this to our senior support team right away.",
    "goodbye": "Thank you for reaching out! Have a great day. Feel free to come back anytime. 😊",
    "what languages do you support": "Our platform currently supports English, Hindi, Tamil, Telugu, French, and Spanish.",
    "hello": "Hello! Welcome to our support center. How can I assist you today?",
    "hi": "Hello! Welcome to our support center. How can I assist you today?",
    "what is chatfusion.ai": "ChatFusion.ai is an AI-powered platform designed to help businesses automate conversations, improve customer support, and enhance user engagement.",
    "how do i create an account": "Click on the “Sign Up” button on the homepage, enter your details, and follow the verification steps to get started.",
    "is there a free trial available": "Yes, ChatFusion.ai offers a free trial so you can explore its features before upgrading to a premium plan.",
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
