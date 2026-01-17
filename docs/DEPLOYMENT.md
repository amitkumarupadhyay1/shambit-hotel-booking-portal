# 🚀 Shambit Hotel Booking Platform - Deployment Guide

## Overview

This guide covers the complete CI/CD pipeline and deployment strategies for the Shambit Hotel Booking Platform.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3002    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Redis         │    │   Docker        │
│   (Reverse      │    │   (Caching)     │    │   (Container)   │
│   Proxy)        │    │   Port: 6379    │    │   (Runtime)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

1. **Main CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - ✅ Frontend build and test
   - ✅ Backend build and test
   - ✅ Security scanning
   - ✅ Automated deployment to Netlify (frontend)
   - ✅ Code coverage reporting

2. **Backend Deployment** (`.github/workflows/deploy-backend.yml`)
   - ✅ Backend-specific deployment
   - ✅ Support for Railway, Render, Heroku

### Pipeline Triggers

- **Push to `main`**: Full deployment
- **Push to `develop`**: Testing and staging
- **Pull Requests**: Testing only
- **Manual**: `workflow_dispatch`

## 🐳 Docker Deployment

### Quick Start

```bash
# Clone the repository
git clone https://github.com/amitkumarupadhyay1/shambit-hotel-booking-portal.git
cd shambit-hotel-booking-portal

# Development deployment
./scripts/deploy.sh development

# Production deployment
./scripts/deploy.sh production
```

### Manual Docker Commands

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

## 🌐 Deployment Platforms

### 1. Frontend Deployment (Netlify)

**Automatic Deployment:**
- Connected to GitHub repository
- Deploys on every push to `main`
- Environment variables configured in Netlify dashboard

**Manual Deployment:**
```bash
# Build locally
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=.next
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
```

### 2. Backend Deployment Options

#### Option A: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### Option B: Render
```bash
# Connect GitHub repository to Render
# Configure build command: cd backend && npm install && npm run build
# Configure start command: cd backend && npm run start:prod
```

#### Option C: Heroku
```bash
# Install Heroku CLI
heroku create shambit-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your-postgres-url

# Deploy
git subtree push --prefix backend heroku main
```

### 3. Database Deployment

#### Option A: Neon (Recommended for PostgreSQL)
```bash
# Create Neon database
# Copy connection string to environment variables
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

#### Option B: Railway PostgreSQL
```bash
# Add PostgreSQL service in Railway dashboard
# Copy connection details to environment variables
```

#### Option C: Supabase
```bash
# Create Supabase project
# Use provided PostgreSQL connection string
```

## 🔧 Environment Configuration

### Development (.env.development)
```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=Aryan21@!
DATABASE_NAME=shambit_dev
JWT_ACCESS_SECRET=dev-jwt-access-secret
JWT_REFRESH_SECRET=dev-jwt-refresh-secret
FRONTEND_URL=http://localhost:3000
PORT=3002
```

### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=super-secure-jwt-access-secret
JWT_REFRESH_SECRET=super-secure-jwt-refresh-secret
FRONTEND_URL=https://shambit.netlify.app
PORT=3002
BCRYPT_ROUNDS=12
```

## 🔒 Security Configuration

### Required Secrets (GitHub Actions)

```yaml
# Netlify
NETLIFY_AUTH_TOKEN: your-netlify-auth-token
NETLIFY_SITE_ID: your-netlify-site-id

# Backend Deployment (choose one)
RAILWAY_TOKEN: your-railway-token
RENDER_API_KEY: your-render-api-key
HEROKU_API_KEY: your-heroku-api-key

# Database
DATABASE_URL: your-production-database-url

# JWT Secrets
JWT_ACCESS_SECRET: your-super-secure-access-secret
JWT_REFRESH_SECRET: your-super-secure-refresh-secret
```

### SSL/TLS Configuration

For production deployments, ensure:
- ✅ HTTPS enabled on frontend
- ✅ SSL certificates configured
- ✅ Secure cookie settings
- ✅ CORS properly configured

## 📊 Monitoring & Health Checks

### Health Endpoints

- **Backend Health**: `GET /health`
- **API Status**: `GET /api/v1/auth/me` (requires auth)

### Monitoring Setup

```bash
# Check service status
curl -f http://localhost:3002/health

# Check frontend
curl -f http://localhost:3000

# View Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose logs postgres
   
   # Verify connection string
   echo $DATABASE_URL
   ```

2. **Frontend Build Failed**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

3. **Backend Not Starting**
   ```bash
   # Check environment variables
   docker-compose exec backend env
   
   # View detailed logs
   docker-compose logs -f backend
   ```

### Performance Optimization

1. **Database Optimization**
   - Enable connection pooling
   - Add database indexes
   - Configure query optimization

2. **Frontend Optimization**
   - Enable image optimization
   - Configure CDN
   - Implement caching strategies

3. **Backend Optimization**
   - Enable compression
   - Configure rate limiting
   - Implement Redis caching

## 📈 Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - backend
```

### Load Balancing

```nginx
upstream backend {
    server backend_1:3002;
    server backend_2:3002;
    server backend_3:3002;
}
```

## 🔄 Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous Docker image
docker-compose down
docker-compose up -d --scale backend=0
docker-compose up -d

# Rollback via GitHub
git revert HEAD
git push origin main
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review application logs
   - Check security updates
   - Monitor performance metrics

2. **Monthly**
   - Update dependencies
   - Review and rotate secrets
   - Backup database

3. **Quarterly**
   - Security audit
   - Performance optimization
   - Infrastructure review

### Emergency Contacts

- **DevOps**: Check GitHub Issues
- **Database**: Monitor connection health
- **Frontend**: Check Netlify status
- **Backend**: Monitor deployment platform

---

## 🎯 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Rollback plan tested
- [ ] Documentation updated

**Ready for production! 🚀**