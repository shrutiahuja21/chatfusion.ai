# ChatFusion.ai Startup Guide

## Project Setup Overview
This repository contains the foundational scaffolding for **ChatFusion.ai**, split into two primary services:
1. **Frontend (`/frontend`)**: A Next.js web application currently housing the premium, dark-mode Chatbot UI Widget.
2. **Backend (`/backend`)**: A FastAPI Python server simulating NLP intent classification, processing user queries, and demonstrating live agent escalation routing.

## How to Run

### 1. Run the Backend (FastAPI + Python)
Open a terminal in the `backend` directory:
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\activate  # Windows only

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on http://localhost:8000)
python main.py
```

### 2. Run the Frontend (Next.js + React)
Open a new terminal in the `frontend` directory:
```bash
cd frontend

# Install dependencies (already installed during scaffolding, but good measure)
npm install

# Start the dev server (runs on http://localhost:3000)
npm run dev
```

### Try it Out!
1. Open up **http://localhost:3000** in your browser.
2. Type queries like:
   - "Hello!" (Triggers Greeting Engine)
   - "What are your features?" (Information Retrieval)
   - "I need to talk to a human agent" (Triggers Live Agent Escalation & Handover).
3. The Next.js frontend will dynamically fetch intents and confidence scores from the Python FastAPI server.

## Next Steps
This project currently simulates the NLP behavior. To switch to a production-scale system:
- **Phase 2 (NLP Engine)**: Replace `chatbot.py` with a live **Rasa** implementation.
- **Phase 3 (DB)**: Enable the initialized `database.py` models inside the FastApi routes to log every message to SQLite/Postgres.
- **Phase 4 (Admin Panel)**: Begin adding routing in Next.js (`/admin`) for analytics reporting and intent training dashboards.
