from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from sqlalchemy import func
from chatbot import stream_message
from logger import logger
from database import SessionLocal, ConversationLog

app = FastAPI(title="ChatFusion.ai Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev. In prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    user_id: str
    channel: str # e.g., 'web', 'mobile'
    text: str

# Store agent status dynamically
agent_queue: List[Message] = []

@app.get("/")
def read_root():
    logger.info("Health check hit.")
    return {"message": "Welcome to ChatFusion.ai Production API"}

@app.post("/api/chat")
async def chat_endpoint(message: Message, background_tasks: BackgroundTasks):
    logger.info(f"Incoming streaming request from User: {message.user_id}")
    
    return StreamingResponse(
        stream_message(message.user_id, message.channel, message.text), 
        media_type="text/event-stream"
    )

@app.get("/api/admin/queue")
def get_agent_queue():
    return {"queue": agent_queue, "waiting": len(agent_queue)}

@app.get("/api/admin/analytics")
def get_analytics():
    db = SessionLocal()
    try:
        total_queries = db.query(ConversationLog).count()
        escalated_queries = db.query(ConversationLog).filter(ConversationLog.escalated_to_agent == True).count()
        automated_resolutions = total_queries - escalated_queries
        
        # Get query intent trends
        intents = db.query(ConversationLog.intent_detected, func.count(ConversationLog.id)).group_by(ConversationLog.intent_detected).all()
        intent_data = [{"name": i[0] or "unknown", "value": i[1]} for i in intents]
        
        return {
            "total_queries": total_queries,
            "escalated_queries": escalated_queries,
            "automated_resolutions": automated_resolutions,
            "escalation_rate": round(escalated_queries / total_queries * 100, 1) if total_queries > 0 else 0,
            "intent_trends": intent_data
        }
    finally:
        db.close()

@app.get("/api/admin/logs")
def get_logs(limit: int = 50):
    db = SessionLocal()
    try:
        logs = db.query(ConversationLog).order_by(ConversationLog.timestamp.desc()).limit(limit).all()
        return {
            "logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "channel": log.channel,
                    "user_message": log.user_message,
                    "bot_response": log.bot_response,
                    "intent": log.intent_detected,
                    "escalated": log.escalated_to_agent,
                    "timestamp": log.timestamp.isoformat()
                } for log in logs
            ]
        }
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting ChatFusion.ai FastAPI Server instance")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
