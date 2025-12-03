# Docker Deployment Guide

## Building Docker Images

### Backend Dockerfile

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src
COPY backend/ml ./ml

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health/live', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "src/index.js"]
\`\`\`

### Frontend Dockerfile

\`\`\`dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.8'

services:
  # Backend
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "5000:5000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - REDIS_URL=redis://redis:6379
      - ADMIN_KEY=${ADMIN_KEY:-admin123}
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    depends_on:
      - backend

  # Redis cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis_data:
\`\`\`

## Running with Docker Compose

\`\`\`bash
# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

## Kubernetes Deployment

### Backend Deployment

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-backend
  template:
    metadata:
      labels:
        app: chatbot-backend
    spec:
      containers:
      - name: backend
        image: chatbot-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: chatbot-backend-service
spec:
  type: LoadBalancer
  selector:
    app: chatbot-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
\`\`\`

## Performance Optimization

### Redis Caching
\`\`\`bash
# Pre-warm cache on startup
docker exec redis redis-cli < cache-warmup.redis
\`\`\`

### Load Balancing
\`\`\`nginx
upstream backend {
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
}

server {
    listen 5000;
    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

---
