# Development Guide

## Project Structure

The project is now organized with separate frontend and backend folders:

```
shambit-hotel-portal/
├── backend/                 # NestJS Backend API
├── frontend/               # Next.js Frontend Application  
├── docs/                   # Documentation
├── scripts/               # Deployment scripts
└── docker-compose.yml     # Container orchestration
```

## Quick Start

### Option 1: Run Both Services (Recommended)
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend in development mode
npm run dev
```

### Option 2: Run Services Separately
```bash
# Backend (Terminal 1)
cd backend
npm install
npm run start:dev

# Frontend (Terminal 2)  
cd frontend
npm install
npm run dev
```

### Option 3: Using Docker
```bash
# Development environment
npm run docker:dev

# Production environment
npm run docker:prod
```

## Available Scripts

### Root Level Scripts
- `npm run dev` - Start both services in development mode
- `npm run build` - Build both services for production
- `npm run start` - Start both services in production mode
- `npm run test` - Run backend tests
- `npm run install:all` - Install dependencies for all services
- `npm run clean` - Clean all node_modules and build artifacts

### Backend Scripts (cd backend)
- `npm run start:dev` - Development mode with hot reload
- `npm run start:prod` - Production mode
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:e2e` - Run integration tests

### Frontend Scripts (cd frontend)
- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production build
- `npm run lint` - Run ESLint

## Environment Configuration

### Backend (.env)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=Aryan21@!
DATABASE_NAME=shambit_hotels
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002/api/v1
- **Backend Health**: http://localhost:3002/health

## Testing

```bash
# Run all backend tests
npm run test

# Run specific test file
cd backend && npm test -- auth.service.spec.ts

# Run tests in watch mode
cd backend && npm run test:watch
```

## Deployment

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to production
./scripts/deploy.sh production
```