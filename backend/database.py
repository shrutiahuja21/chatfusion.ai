from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Uses Docker environment variable if available, otherwise local string
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./chatfusion.db"
)

# For Postgres, connect_args aren't needed the way SQLite needs check_same_thread
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ConversationLog(Base):
    __tablename__ = "conversation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    channel = Column(String, default="web")
    user_message = Column(Text)
    bot_response = Column(Text)
    intent_detected = Column(String)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    escalated_to_agent = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)
