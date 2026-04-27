# ChatFusion.ai Architecture Documentation

## System Overview

ChatFusion.ai is an intelligent, scalable customer support chatbot platform designed to handle user queries across multiple channels (Web and Mobile). By leveraging modern frontend and backend frameworks, the architecture ensures real-time streaming AI responses, strict conversation logging, live agent handover, and real-time operational analytics.

## Tech Stack

- **Frontend Segment:** Next.js (React 18), Tailwind CSS
- **Backend Service:** FastAPI, Python 3
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **AI/NLP Engine:** OpenAI API (GPT-4o-mini)
- **Infrastructure:** Docker & Docker Compose (Containerized deployments)

## Architectural Components

### 1. NLP & Chat Engine (`backend/chatbot.py`)
Responsible for semantic understanding and real-time natural language generation. 
- Built around the OpenAI SDK configured for generative Q&A tasks.
- Produces Server-Sent Events (SSE) representing conversation chunks.
- Checks dynamically for routing intent (e.g., when the user explicitly requests human assistance, an `[ESCALATE]` marker directs the flow to live agents).

### 2. Request Handling API (`backend/main.py`)
Built on FastAPI. It defines the core routing endpoints.
- `/api/chat`: A `POST` endpoint receiving the user IDs, target channel, and text. Returns a `StreamingResponse` linked to the Generator in `chatbot.py`.
- `/api/admin/analytics`: Aggregates the statistics of total automated interactions versus escalated engagements. Compiles trends over recognized user intents.
- `/api/admin/logs`: Serves as the persistence retrieval endpoint, feeding real-time user-bot conversation scripts to the administrative frontend.

### 3. Data Persistence (`backend/database.py`)
Centralized logging ensures analytics and compliance.
- Uses `SQLAlchemy` to construct the `ConversationLog` relational table.
- Each payload persists critical operational parameters: User ID, Input query, Generated Bot Response, Deduced Intent, Confidence level, and Agent Escalation flag.

### 4. Client Interfacing
- **User Dashboard (`frontend/src/app/dashboard/page.tsx`):** A dark-blue theme UI that allows interactive texting with the assistant. Employs real-time visual parsers reading SSE streams, simulating dynamic human-like typing responses.
- **Admin Command Center (`frontend/src/app/admin/page.tsx`):** A secure, data-rich live panel monitoring query resolution performance. Displays critical KPIs (e.g., Resolution Rate, Incident Escalations) and an endless updating scroll of active conversations.

## Data Schema & Workflows

**Conversation Processing Lifecycle:**
1. User transmits query text securely via frontend standard HTTP/POST.
2. The FastAPI `chat_endpoint` initiates the OpenAI streaming process.
3. Chunks stream via SSE to the browser for instant visualization.
4. Upon completion or `[ESCALATE]` inference, the final payload is securely written to `PostgreSQL`.
5. The Admin Analytics panel fetches updated polling data from `/api/admin/analytics`.

### Database Schema (ConversationLog)
- `id` (PK, Integer)
- `user_id` (String, Indexed)
- `channel` (String, default: "web")
- `user_message` (Text)
- `bot_response` (Text)
- `intent_detected` (String)
- `confidence` (Float)
- `timestamp` (DateTime)
- `escalated_to_agent` (Boolean)

## Evaluation Metrics & Optimizations
- **Response Latency:** Sub-second TTFB (Time To First Byte) via implementation of `StreamingResponse`, yielding the first generation token dynamically.
- **Deflection Rate Tracking:** Native analytics calculate automated resolutions, targeting an automated deflection rate >80%. Accuracy improvements can be fine-tuned via analyzing the captured logs.
- **Design Experience:** Seamless dark Obsidian interface constructed purely with TailwindCSS ensures high contrast and zero UI lag.
