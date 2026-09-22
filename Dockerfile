# One service: Flask API + the built React app on the same origin.

# ── 1. Build the React app ──
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ── 2. Python runtime ──
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    TRUST_PROXY=1 \
    FRONTEND_DIST=/app/frontend/dist
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY backend/ ./
COPY --from=web /app/frontend/dist /app/frontend/dist

# Railway provides $PORT. One worker (the rate limiter and the optional in-memory
# store live in-process), several threads for concurrent requests.
CMD gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 8 --timeout 60 --access-logfile -
