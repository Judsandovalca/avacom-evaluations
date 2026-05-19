# AVACOM Evaluation Management System

[![CI/CD](https://github.com/Judsandovalca/avacom-evaluations/actions/workflows/cicd.yml/badge.svg?branch=main)](https://github.com/Judsandovalca/avacom-evaluations/actions/workflows/cicd.yml)
[![Live](https://img.shields.io/badge/live-d2h0na5j6cm5jo.cloudfront.net-blue)](https://d2h0na5j6cm5jo.cloudfront.net)
![Node](https://img.shields.io/badge/node-22.x-green.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

Full-stack serverless CRUD app for managing course evaluations.

## Architecture

- **Backend:** AWS Lambda (Node 22 + TypeScript + Hono) with hexagonal architecture, two DynamoDB tables, JWT auth via httpOnly cookies. Deployed via AWS SAM.
- **Frontend:** React 19 + Vite 8 + Tailwind, deployed to S3 behind a single CloudFront distribution that also proxies `/api/*` to API Gateway.
- **Testing:** 96%+ statement coverage on both sides (Vitest + DynamoDB Local + MSW).

See [`docs/diagrams/`](./docs/diagrams/) for visual architecture diagrams and [`docs/superpowers/specs/`](./docs/superpowers/specs/) for the full spec.

## Live URLs

- **App (via CloudFront):** https://d2h0na5j6cm5jo.cloudfront.net
- **API (via CloudFront proxy):** https://d2h0na5j6cm5jo.cloudfront.net/api/health
- API Gateway direct (debugging only): https://gdgpufwpd3.execute-api.us-east-1.amazonaws.com/api/health

## Quick start (local dev)

```bash
# Backend (terminal 1)
cd backend
npm install
npm run ddb:up
npm run dev   # SAM Local on port 3000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev   # Vite on port 5173 (proxies /api -> :3000)
```

## Deploy

```bash
# 1. Backend
cd backend
npm install
npm run deploy:guided   # first time only
npm run deploy

# 2. CloudFront + S3 (one-time)
cd ..
bash infra/deploy-cloudfront.sh

# 3. Frontend
bash infra/deploy-frontend.sh
```

## Repository layout

```
avacomProjecto/
├── backend/             AWS Lambda + DynamoDB API (hexagonal)
├── frontend/            React + Vite + Tailwind SPA
├── infra/               CloudFront stack and deploy scripts
├── docs/
│   ├── diagrams/        Mermaid architecture diagrams
│   └── superpowers/
│       ├── specs/       Feature spec
│       └── plans/       Implementation plans
└── .github/workflows/   CI
```

## Key decisions

See [§2 Decisions & Tradeoffs](./docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md#2-decisions--tradeoffs) of the spec — every choice has a defensible rationale and a written Q&A defense.

## Tests

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm test -- --coverage
```

CI runs both on every push and uploads coverage artifacts.

## License

Private. Internal use only.
