# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

# Set working directory
WORKDIR /app

# Install system dependencies (required for passlib/bcrypt/jose cryptography compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend source files
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Expose port (Railway overrides this with $PORT dynamically)
EXPOSE 8000

# Run uvicorn server using shell execution to parse $PORT dynamically
CMD ["sh", "-c", "python -m uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
