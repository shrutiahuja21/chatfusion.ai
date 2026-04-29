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

## Deployment

### 1. Backend (FastAPI) - Recommended: Render
This project is configured for one-click deployment on **Render**.
1. Log in to [Render.com](https://render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file and set up:
   - A **PostgreSQL** database.
   - A **FastAPI** web service.
5. Once deployed, copy your backend URL (e.g., `https://chatfusion-backend.onrender.com`).

### 2. Frontend (Next.js) - Recommended: Vercel
1. Log in to [Vercel.com](https://vercel.com).
2. Import your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL.
5. Click **Deploy**.

## Next Steps
This project currently uses a local NLP engine for fast responses. To switch to a production-scale system:
- **Phase 2 (NLP Engine)**: Replace the local `FAQ_KB` in `chatbot.py` with a live **Claude** or **OpenAI** implementation by providing the API keys in your environment variables.
- **Phase 3 (Admin Panel)**: Use the Admin Command Center (`/admin`) to monitor logs and analytics served from the FastAPI backend.
