FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install gunicorn for production grade WSGI/ASGI serving
RUN pip install gunicorn

# Copy all local files
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Production CMD using Gunicorn + Uvicorn worker class for Async Support
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "main:app", "-b", "0.0.0.0:8000"]
