import json
import os
from openai import OpenAI
from logger import logger
from database import SessionLocal, ConversationLog

# Initialize the OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "your_openai_api_key_here"))

def stream_message(user_id: str, channel: str, text: str):
    """
    Process incoming user text using OpenAI, streaming the response down chunk by chunk.
    It yields Server-Sent Events (SSE) that Next.js can read in real time.
    Also logs the conversation to the database.
    """
    logger.info(f"Initiating OpenAI streaming for query: {text}")
    
    system_prompt = '''
You are ChatFusion.ai's premium customer support assistant. 
Your goal is to answer user queries politely.
IMPORTANT: If the user asks for a human agent, support team, or live person, you MUST begin your response with "[ESCALATE]".
Keep answers concise and conversational.
'''

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.7,
            max_tokens=250,
            stream=True
        )
        
        is_escalated = False
        buffer = ""
        
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                buffer += content
                
                # Check for escalation marker at the very start
                if "[ESCALATE]" in buffer and not is_escalated:
                    logger.info("Bot detected live agent escalation via marker.")
                    is_escalated = True
                    yield f"data: {json.dumps({'type': 'intent', 'value': 'request_human'})}\n\n"
                    
                    # Clean the buffer of the keyword so user doesn't see it
                    buffer = buffer.replace("[ESCALATE]", "")
                    content = content.replace("[ESCALATE]", "")
                
                if content.strip() or " " in content:
                    yield f"data: {json.dumps({'type': 'content', 'value': content})}\n\n"
        
        # If no escalation happened, send general query intent
        if not is_escalated:
             yield f"data: {json.dumps({'type': 'intent', 'value': 'general_query'})}\n\n"
             
        yield "data: [DONE]\n\n"
        logger.info("AI Stream finished. Saving to database.")

        # Save to Database
        db_session = SessionLocal()
        try:
            log_entry = ConversationLog(
                user_id=user_id,
                channel=channel,
                user_message=text,
                bot_response=buffer,
                intent_detected="request_human" if is_escalated else "general_query",
                confidence=1.0,  # Mock confidence
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
        logger.error(f"OpenAI Error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'value': 'I encountered an issue processing your request.'})}\n\n"
        yield "data: [DONE]\n\n"
