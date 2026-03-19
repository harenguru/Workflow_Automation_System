Workflow Automation System

A full-stack app for building and running dynamic workflows. You define the steps, write rules to control routing, and the system handles execution, logging, and retries.

---

What's in here

- React + Vite frontend with Tailwind CSS
- Express + TypeScript backend
- PostgreSQL via Prisma ORM (hosted on Neon - https://neon.tech)
- Redis queue via BullMQ (hosted on Upstash - https://upstash.com)
- A rule engine using jexl expressions for step routing
- A separate worker process that picks up and runs jobs from the queue

```
Frontend (React)
    │
    │  REST API
    ▼
Backend (Express)
    │
    ├── Prisma → PostgreSQL (Neon)
    │
    └── BullMQ → Redis (Upstash)
            │
            ▼
        Worker → Workflow Engine → Rule Engine
```

---

Before you start

You need:
- Node.js 20+
- A Neon Postgres database (free tier is fine) — https://neon.tech
- An Upstash Redis instance (free tier is fine) — https://upstash.com

---

Setup

1. Clone and install

```bash
git clone <repo-url>
cd dynamic-workflow-automation
npm run install:all
```

2. Set up environment variables

Create a file at backend/.env with the following:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
DIRECT_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
REDIS_URL=rediss://:<password>@<host>:<port>
PORT=3000
```

DIRECT_URL is needed by Prisma for migrations on Neon.

Note : The .env file is not included for security reasons.
Please contact me at harenguruv@gmail.com and I'll send it over so you can run the project immediately.

3. Run migrations and seed

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
cd ..
```

This creates the tables and seeds two sample workflows: Expense Approval and Employee Onboarding.

4. Start everything

```bash
npm run dev
```

This runs three processes at once using concurrently:

| Process | What it does | Port |
|---------|-------------|------|
| API     | Express backend | 3000 |
| WORKER  | BullMQ job worker | — |
| UI      | Vite dev server | 5173 |

Open http://localhost:5173

---

Environment variables

| Variable | What it's for |
|----------|--------------|
| DATABASE_URL | Neon Postgres connection string |
| DIRECT_URL | Same as above, used by Prisma for migrations |
| REDIS_URL | Upstash Redis connection string |
| PORT | Backend port, defaults to 3000 |

---

Running tests

```bash
cd backend
npm test
```

There are unit tests for the rule engine, integration tests for the workflow engine, and property-based tests using fast-check.

---

API reference

Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows | Create a workflow |
| GET | /api/workflows | List workflows (supports search + pagination) |
| GET | /api/workflows/:id | Get a single workflow |
| PUT | /api/workflows/:id | Update a workflow |
| DELETE | /api/workflows/:id | Delete a workflow |

Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/steps | Add a step |
| GET | /api/workflows/:workflowId/steps | List steps |
| PUT | /api/steps/:id | Update a step |
| DELETE | /api/steps/:id | Delete a step |

Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/steps/:stepId/rules | Add a rule to a step |
| GET | /api/steps/:stepId/rules | List rules for a step |
| PUT | /api/rules/:id | Update a rule |
| DELETE | /api/rules/:id | Delete a rule |
| PUT | /api/steps/:stepId/rules/reorder | Reorder rules by priority |

Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/execute | Trigger a new execution |
| GET | /api/executions | List all executions |
| GET | /api/executions/:id | Get execution status and logs |
| POST | /api/executions/:id/cancel | Cancel a running execution |
| POST | /api/executions/:id/retry | Retry a failed execution |
| DELETE | /api/executions/:id | Delete an execution record |

There's also a health check at GET /health.

---

How the rule engine works

Each step can have multiple rules. When the workflow reaches a step, it evaluates the rules in priority order (lowest number first) and takes the first one that matches.

Rules are written as jexl expressions evaluated against the execution's input data.

Supported operators: ==, !=, >, <, >=, <=, &&, ||

Use DEFAULT as the condition to match when nothing else does.

Example:

```
Input: { "amount": 250, "department": "Engineering" }

Rule priority 0 → "amount > 500"   → false, skip
Rule priority 1 → "amount > 100"   → true  → route to next step
Rule priority 2 → "DEFAULT"        → skipped
```

---

Execution lifecycle

```
pending → in_progress → completed
                      → failed
                      → canceled
```

- A failed execution can be retried — it creates a new run with retries + 1
- A pending or in-progress execution can be canceled
- The engine stops after 50 step iterations to prevent infinite loops

---

Sample workflows

1. Expense Approval

Trigger input:
```json
{ "amount": 250, "country": "US", "priority": "High", "department": "Engineering" }
```

| Input | Path taken |
|-------|-----------|
| amount > 100, country=US, priority=High | Manager Approval → Finance Notification → Task Completion |
| amount > 5000, country=US, priority=High | Manager Approval → Finance Notification → CEO Approval → Task Completion |
| amount <= 100 or department=HR | Manager Approval → CEO Approval → Task Completion |
| priority=Low, country!=US | Manager Approval → Task Rejection |

2. Employee Onboarding

Trigger input:
```json
{ "department": "engineering", "seniority": "senior", "employee_name": "Alice" }
```

| Input | Path taken |
|-------|-----------|
| department=engineering, seniority=senior | Initial Review → Engineering Onboarding → Manager Approval → Send Welcome Email |
| department=engineering, seniority=junior | Initial Review → Engineering Onboarding → Send Welcome Email |
| any other department | Initial Review → General Onboarding → Send Welcome Email |

---

Execution example

Using the Expense Approval workflow with this input:

```json
{ "amount": 250, "country": "US", "priority": "High", "department": "Engineering" }
```

The execution log looks like this:

```json
[
  {
    "step_name": "Manager Approval",
    "step_type": "approval",
    "evaluated_rules": [
      { "rule": "amount > 100 && country == 'US' && priority == 'High'", "result": true },
      { "rule": "amount <= 100 || department == 'HR'", "result": false }
    ],
    "selected_next_step": "Finance Notification",
    "status": "completed",
    "approver_id": null,
    "error_message": null,
    "started_at": "2026-02-18T10:00:00Z",
    "ended_at": "2026-02-18T10:00:03Z"
  },
  {
    "step_name": "Finance Notification",
    "step_type": "notification",
    "evaluated_rules": [
      { "rule": "amount > 5000", "result": false },
      { "rule": "DEFAULT", "result": true }
    ],
    "selected_next_step": "Task Completion",
    "status": "completed",
    "approver_id": null,
    "error_message": null,
    "started_at": "2026-02-18T10:00:03Z",
    "ended_at": "2026-02-18T10:00:05Z"
  },
  {
    "step_name": "Task Completion",
    "step_type": "task",
    "evaluated_rules": [],
    "selected_next_step": null,
    "status": "completed",
    "approver_id": null,
    "error_message": null,
    "started_at": "2026-02-18T10:00:05Z",
    "ended_at": "2026-02-18T10:00:06Z"
  }
]
```

The first rule matched (amount > 100 && country == 'US' && priority == 'High'), so the workflow routed through Manager Approval → Finance Notification → Task Completion and finished with status completed.

---

Project structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB models
│   │   ├── seed.ts             # Seeds sample workflows
│   │   └── migrations/
│   └── src/
│       ├── engine/
│       │   ├── ruleEngine.ts       # jexl expression evaluator
│       │   └── workflowEngine.ts   # step-by-step execution driver
│       ├── queue/
│       │   ├── producer.ts         # enqueues jobs
│       │   └── consumer.ts         # processes jobs
│       ├── services/           # business logic
│       ├── controllers/        # route handlers
│       ├── routes/             # route definitions
│       ├── middleware/         # validation, error handling
│       ├── server.ts           # API setup
│       └── worker.ts           # worker entry point
├── frontend/
│   └── src/
│       ├── pages/              # Dashboard, WorkflowEditor, ExecutionRunner, AuditLog
│       ├── components/         # UI components
│       ├── hooks/              # React Query hooks
│       └── api/client.ts       # typed API client
├── package.json                # root — runs everything with npm run dev
└── README.md
```
