# Complete Deployment Guide

## Table of Contents
1. Local Development
2. Docker Deployment
3. Kubernetes
4. Vercel (Frontend)
5. Production Checklist

## 1. Local Development

\`\`\`bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
npm install
npm run dev
\`\`\`

## 2. Production Deployment

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] SSL certificates ready
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Log rotation configured
- [ ] Rate limiting thresholds adjusted
- [ ] Admin key secured

### Health Checks
\`\`\`bash
# Basic health
curl http://your-domain/health

# Detailed health
curl http://your-domain/health/detailed

# Readiness
curl http://your-domain/health/ready
\`\`\`

## 3. Monitoring & Alerts

### Key Metrics to Monitor
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate
- Active sessions
- Rate limiter blocks
- API failures

### Recommended Tools
- Prometheus: Metrics collection
- Grafana: Visualization
- Sentry: Error tracking
- Datadog: Full observability
- ELK Stack: Log aggregation

## 4. Scaling

### Horizontal Scaling
\`\`\`bash
# Run 3 backend instances behind load balancer
node src/index.js --port 5001
node src/index.js --port 5002
node src/index.js --port 5003
\`\`\`

### Vertical Scaling
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Increase worker threads for PDF processing
- Optimize Redis cache eviction

## 5. Troubleshooting

### Common Issues

**Issue**: High memory usage
\`\`\`bash
# Check memory
free -h

# Increase Node.js heap
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Clear old sessions
curl -X DELETE http://localhost:5000/api/admin/alerts \
  -H "X-Admin-Key: admin123"
\`\`\`

**Issue**: Slow responses
\`\`\`bash
# Check cache performance
curl http://localhost:5000/api/admin/api-usage \
  -H "X-Admin-Key: admin123"

# Enable debug logging
DEBUG=* npm start
\`\`\`

**Issue**: Rate limiting too strict
\`\`\`env
# Adjust in .env
RATE_LIMIT_PER_SESSION=100
RATE_LIMIT_PER_USER=200
\`\`\`

---
