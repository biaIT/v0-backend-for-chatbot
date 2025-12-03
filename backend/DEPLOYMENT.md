# Deployment Guide

Deploy the production-ready chatbot backend to various platforms.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] `.env` file not committed to Git
- [ ] `.gitignore` includes `.env`
- [ ] All tests passing
- [ ] API keys valid and active
- [ ] Redis running (if using queue)
- [ ] Logs directory writable
- [ ] Node modules installed

## Local Production Testing

\`\`\`bash
# Build and test as production
NODE_ENV=production npm start

# Check for errors
tail -f logs/error.log
\`\`\`

## Vercel Deployment

### 1. Setup

\`\`\`bash
npm install -g vercel
vercel login
cd backend && vercel
\`\`\`

### 2. Configure Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all from `.env`:
   - `OPENAI_API_KEY`
   - `GROQ_API_KEY`
   - `NEWS_API_KEY`
   - `REDIS_HOST` (if using)
   - `REDIS_PORT`

### 3. Deploy

\`\`\`bash
vercel --prod
\`\`\`

Get production URL: `https://your-app.vercel.app`

### 4. Configure Frontend

Update frontend API calls:
\`\`\`javascript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-app.vercel.app'
\`\`\`

## Heroku Deployment

### 1. Setup

\`\`\`bash
npm install -g heroku
heroku login
heroku create chatbot-backend
\`\`\`

### 2. Add Environment Variables

\`\`\`bash
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set GROQ_API_KEY=gsk-...
heroku config:set NEWS_API_KEY=...
heroku config:set REDIS_HOST=redis-hostname
heroku config:set REDIS_PORT=6379
\`\`\`

### 3. Deploy

\`\`\`bash
git push heroku main
\`\`\`

### 4. Monitor

\`\`\`bash
heroku logs --tail
heroku ps
heroku config
\`\`\`

## Docker Deployment

### 1. Create Dockerfile

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src
COPY backend/data ./data

# Create logs directory
RUN mkdir -p logs

EXPOSE 5000

CMD ["node", "src/index.js"]
\`\`\`

### 2. Create .dockerignore

\`\`\`
node_modules
npm-debug.log
logs/*
.env
.git
\`\`\`

### 3. Build and Run

\`\`\`bash
# Build
docker build -t chatbot-backend .

# Run locally
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=sk-... \
  -e NEWS_API_KEY=... \
  -v logs:/app/logs \
  chatbot-backend

# Push to registry
docker tag chatbot-backend gcr.io/your-project/chatbot-backend
docker push gcr.io/your-project/chatbot-backend
\`\`\`

## Railway Deployment

### 1. Connect Repository

1. Go to https://railway.app
2. Click "Deploy from GitHub"
3. Select your repo
4. Add `backend` as root directory

### 2. Configure Variables

In Railway dashboard → Variables:
\`\`\`
OPENAI_API_KEY=sk-...
NEWS_API_KEY=...
REDIS_URL=your-redis-url
PORT=5000
NODE_ENV=production
\`\`\`

### 3. Deploy

Click "Deploy" - automatic on push to main

## AWS Deployment

### EC2

\`\`\`bash
# SSH to instance
ssh -i key.pem ec2-user@your-instance

# Install Node
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs

# Clone repo
git clone your-repo
cd backend
npm install

# Setup .env
nano .env

# Install PM2 for process management
npm install -g pm2
pm2 start src/index.js --name "chatbot-backend"
pm2 save
pm2 startup
\`\`\`

### Elastic Beanstalk

\`\`\`bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 chatbot-backend

# Create environment
eb create chatbot-env

# Set environment variables
eb setenv OPENAI_API_KEY=sk-... NEWS_API_KEY=...

# Deploy
eb deploy

# Monitor
eb logs
\`\`\`

## DigitalOcean App Platform

### 1. Connect GitHub

1. Go to DigitalOcean → Apps
2. Select "GitHub Repo"
3. Select your repository

### 2. Configure

- **Source:** `/backend`
- **Environment:** Node.js
- **Build:** `npm install`
- **Run:** `npm start`

### 3. Environment Variables

Add in App Platform console:
- `OPENAI_API_KEY`
- `NEWS_API_KEY`
- `REDIS_HOST`

### 4. Deploy

Click "Deploy App" - automatic on push

## CapRover (Self-Hosted)

### 1. Setup CapRover

\`\`\`bash
docker run -v /var/run/docker.sock:/var/run/docker.sock \
  -p 80:80 -p 443:443 -p 3000:3000 \
  caprover/caprover
\`\`\`

### 2. Connect App

1. SSH to server
2. Create `captain-definition` file:

\`\`\`json
{
  "schemaVersion": 2,
  "imageName": "chatbot-backend:latest",
  "containerPorts": ["5000"],
  "serviceUpdateIntervalSec": 10,
  "caproverExtra": {
    "containerHttpPort": "5000",
    "nginxServerConfig": "",
    "notExposeAsWebApp": "false",
    "ports": ["5000"],
    "volumes": ["logs:/app/logs"]
  }
}
\`\`\`

### 3. Deploy

\`\`\`bash
git push caprover main
\`\`\`

## Scaling Considerations

### Load Balancing

Use NGINX or cloud provider's load balancer:

\`\`\`nginx
upstream backend {
  server localhost:5000;
  server localhost:5001;
  server localhost:5002;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}
\`\`\`

### Database for Sessions

Replace in-memory sessions with database:

\`\`\`javascript
// src/utils/sessionManager.js
const db = require('./database')
// Use PostgreSQL/MongoDB instead of Map
\`\`\`

### Redis Cluster

For production queue:

\`\`\`env
REDIS_CLUSTER=true
REDIS_NODES=node1:6379,node2:6379,node3:6379
\`\`\`

### CDN for Static Assets

Use CloudFront or Cloudflare for API responses.

## Monitoring & Alerts

### Sentry Integration

\`\`\`bash
npm install @sentry/node

# In index.js
import * as Sentry from "@sentry/node"
Sentry.init({ dsn: process.env.SENTRY_DSN })
\`\`\`

### Datadog

\`\`\`bash
npm install dd-trace

# In index.js
require('dd-trace').init()
\`\`\`

### CloudWatch (AWS)

\`\`\`bash
npm install aws-sdk

# Logs automatically to CloudWatch
\`\`\`

## Health Checks

Most platforms support:

\`\`\`
GET /health
Response: { "status": "ok" }
\`\`\`

Configure health check every 30 seconds with 3 consecutive failures to mark unhealthy.

## Rollback Procedure

### Vercel

\`\`\`bash
vercel rollback  # Reverts to previous deployment
\`\`\`

### Heroku

\`\`\`bash
heroku releases           # List releases
heroku rollback          # Revert to previous
heroku rollback v123     # Revert to specific version
\`\`\`

### Docker/Self-Hosted

\`\`\`bash
# Tag previous version
git revert <commit-hash>
git push
# Redeploy
\`\`\`

## Backup & Recovery

### Database Backups

\`\`\`bash
# MongoDB
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/db"

# PostgreSQL
pg_dump -U user -d chatbot_db > backup.sql
\`\`\`

### Log Backups

\`\`\`bash
# Compress and archive logs
tar -czf logs_backup.tar.gz logs/
aws s3 cp logs_backup.tar.gz s3://backup-bucket/
\`\`\`

## Performance Optimization for Production

1. **Enable Gzip Compression**
\`\`\`javascript
import compression from 'compression'
app.use(compression())
\`\`\`

2. **Connection Pooling**
\`\`\`javascript
// For database connections
const pool = new Pool({ max: 20 })
\`\`\`

3. **CDN for Files**
\`\`\`javascript
// Serve PDFs from CDN
const STATIC_URL = 'https://cdn.yourdomain.com'
\`\`\`

4. **Rate Limiting per IP**
\`\`\`javascript
const limiter = rateLimit({
  store: redisStore,  // Use Redis store
  max: 100
})
\`\`\`

## Security Hardening

1. **HTTPS Only**
\`\`\`javascript
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})
\`\`\`

2. **API Key Rotation**
- Set reminder to rotate keys monthly
- Use versioned keys when possible

3. **Firewall Rules**
- Allow traffic only from known IPs
- Block suspicious patterns

4. **DDoS Protection**
- Use Cloudflare or similar service
- Enable rate limiting

## Troubleshooting Deployments

### "Cannot find module"
\`\`\`bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
\`\`\`

### "Port already in use"
\`\`\`bash
# Kill process
lsof -i :5000
kill -9 <PID>
\`\`\`

### "Environment variable not found"
- Verify variable set in platform console
- Restart app after setting
- Check variable name spelling

### "Low memory"
- Increase container memory
- Check for memory leaks
- Optimize large queries

## Support

For deployment issues:
1. Check platform documentation
2. Review deployment logs
3. Test locally: `NODE_ENV=production npm start`
4. Check `.env` variables
5. Verify network connectivity

---

Happy deploying! 🚀
