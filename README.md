# FlowEngine — Dynamic Workflow Automation System

A full-stack workflow automation platform for building, managing, and executing dynamic multi-step workflows with rule-based routing.

**Live Demo:** https://workflow-automation-system-1.netlify.app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma ORM (Neon) |
| Queue | BullMQ + Redis (Upstash) |
| Rule Engine | jexl expression evaluator |
| Deployment | Netlify (frontend) + Render (backend) |

---

## Architecture

```
Frontend (React + Vite)
    │
    │  REST API
    ▼
Backend (Express + TypeScript)
    │
    ├── Prisma → PostgreSQL (Neon)
    │
    └── BullMQ → Redis (Upstash)
            │
            ▼
        Worker → Workflow Engine → Rule Engine
```

---

## Features

- Create and manage workflows with custom steps and routing rules
- Step types: task, approval, notification
- Rule-based routing using jexl expressions (evaluated against execution input)
- Async execution via BullMQ job queue
- Real-time execution tracking with step-by-step timeline
- Audit log with full execution history
- Cancel, retry, and delete executions
- Fully responsive — works on mobile and desktop

---

## Local Development

### Prerequisites

- Node.js 20+
- Neon PostgreSQL database — https://neon.tech
- Upstash Redis instance — https://upstash.com

### Setup

```bash
# Clone and install all dependencies
git clone https://github.com/harenguru/Workflow_Automation_System.git
cd Workflow_Automation_System
npm run install:all
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
REDIS_URL=rediss://:<password>@<host>:<port>
PORT=3000
NODE_ENV=development
```

> The `.env` file is not committed for security reasons.
> Contact harenguruv@gmail.com to get the credentials for immediate local setup.

### Database setup

```bash
cd backend
npx prisma db push
npx prisma db seed
cd ..
```

### Run

```bash
npm run dev
```

This starts three processes concurrently:

| Process | Description | Port |
|---------|-------------|------|
| API | Express backend | 3000 |
| WORKER | BullMQ job processor | — |
| UI | Vite dev server | 5173 |

Open http://localhost:5173

---

## Deployment

| Service | Purpose | URL |
|---------|---------|-----|
| Netlify | Frontend hosting | https://workflow-automation-system-1.netlify.app |
| Render | Backend API + Worker | https://workflow-automation-system-gmfq.onrender.com |
| Neon | PostgreSQL database | https://neon.tech |
| Upstash | Redis queue | https://upstash.com |

---

## API Reference

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows | Create a workflow |
| GET | /api/workflows | List workflows (search + pagination) |
| GET | /api/workflows/:id | Get a workflow |
| PUT | /api/workflows/:id | Update a workflow |
| DELETE | /api/workflows/:id | Delete a workflow |

### Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/steps | Add a step |
| GET | /api/workflows/:workflowId/steps | List steps |
| PUT | /api/steps/:id | Update a step |
| DELETE | /api/steps/:id | Delete a step |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/steps/:stepId/rules | Add a rule |
| GET | /api/steps/:stepId/rules | List rules |
| PUT | /api/rules/:id | Update a rule |
| DELETE | /api/rules/:id | Delete a rule |
| PUT | /api/steps/:stepId/rules/reorder | Reorder rules by priority |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/execute | Trigger execution |
| GET | /api/executions | List all executions |
| GET | /api/executions/:id | Get execution details + logs |
| POST | /api/executions/:id/cancel | Cancel execution |
| POST | /api/executions/:id/retry | Retry failed execution |
| DELETE | /api/executions/:id | Delete execution record |
| GET | /health | Health check |

---

## Rule Engine

Rules are jexl expressions evaluated against the execution's input data. Rules are checked in priority order — first match wins.

Supported operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`

Use `DEFAULT` as the condition to always match (fallback rule).

```
Input: { "amount": 250, "department": "Engineering" }

Priority 1 → "amount > 500"   → false, skip
Priority 2 → "amount > 100"   → true  → route to next step
Priority 3 → "DEFAULT"        → skipped
```

---

## Execution Lifecycle

```
pending → in_progress → completed
                      → failed (retryable)
                      → canceled
```

- Failed executions can be retried (creates a new run with retries + 1)
- Pending/in-progress executions can be canceled
- Engine stops after 50 iterations to prevent infinite loops

---

## Sample Workflows

### 1. Expense Approval

Input fields: `amount` (number), `country` (string), `priority` (High/Medium/Low), `department` (string)

| Condition | Route |
|-----------|-------|
| amount > 100, country=US, priority=High | Manager Approval → Finance Notification → Task Completion |
| amount > 5000 after Finance | Finance Notification → CEO Approval → Task Completion |
| amount <= 100 or department=HR | Manager Approval → CEO Approval → Task Completion |
| priority=Low, country≠US | Manager Approval → Task Rejection |

### 2. Employee Onboarding

Input fields: `department` (string), `seniority` (string), `employee_name` (string)

| Condition | Route |
|-----------|-------|
| department=engineering, seniority=senior | Initial Review → Engineering Onboarding → Manager Approval → Welcome Email |
| department=engineering, other seniority | Initial Review → Engineering Onboarding → Welcome Email |
| any other department | Initial Review → General Onboarding → Welcome Email |

---

## Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # DB models
│   │   ├── seed.ts               # Seeds sample workflows
│   │   └── migrations/
│   └── src/
│       ├── engine/
│       │   ├── ruleEngine.ts     # jexl expression evaluator
│       │   └── workflowEngine.ts # step execution driver
│       ├── queue/
│       │   ├── producer.ts       # enqueues jobs
│       │   └── consumer.ts       # processes jobs
│       ├── services/             # business logic
│       ├── controllers/          # route handlers
│       ├── routes/               # route definitions
│       ├── middleware/           # validation, error handling
│       ├── server.ts             # API entry point
│       └── worker.ts             # worker entry point
├── frontend/
│   └── src/
│       ├── pages/                # Dashboard, WorkflowEditor, ExecutionRunner, AuditLog
│       ├── components/           # UI components
│       ├── hooks/                # React Query hooks
│       └── api/client.ts         # typed API client
├── package.json                  # root — runs all with npm run dev
└── README.md
```

---

## Tests

```bash
cd backend
npm test
```

Includes unit tests for the rule engine, integration tests for the workflow engine, and property-based tests using fast-check.
