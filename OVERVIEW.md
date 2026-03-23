# Project Overview — FlowEngine

**Live:** [https://workflow-automation-system-1.netlify.app](https://workflow-automation-system-1.netlify.app)

**Backend:** [https://workflow-automation-system-gmfq.onrender.com](https://workflow-automation-system-gmfq.onrender.com)

**Repository:** [https://github.com/harenguru/Workflow_Automation_System](https://github.com/harenguru/Workflow_Automation_System)

---

## What is this?

FlowEngine is a dynamic workflow automation system that lets you define multi-step business processes, write rules to control how they route between steps, and execute them with full tracking and audit history.

Think of it like a lightweight version of tools like Zapier or Temporal — fully custom-built, self-contained, and open source.

---

## Core Concepts

**Workflow** — a named process made up of ordered steps. Has an input schema that defines what data it expects.

**Step** — a single stage in a workflow. Three types:
- `task` — a unit of work to be done
- `approval` — requires a human decision
- `notification` — sends an alert or message

**Rule** — a condition attached to a step that determines which step runs next. Written as a jexl expression evaluated against the execution's input data. Rules are checked in priority order — first match wins. Use `DEFAULT` as a fallback.

**Execution** — a single run of a workflow with specific input data. Moves through steps based on rule evaluation. Has a full log of every step taken.

---

## How an Execution Works

1. User triggers a workflow with input data (e.g. `{ "amount": 500, "country": "US" }`)
2. Backend creates an execution record and pushes a job to the Redis queue
3. Worker picks up the job and runs the workflow engine
4. Engine evaluates rules at each step to determine the next step
5. Execution completes (or fails/cancels) with a full step-by-step log
6. Frontend polls for status updates and displays the timeline

---

## Pages

| Page | What it does |
|------|-------------|
| Workflows (Dashboard) | Lists all workflows with search, pagination, and stat cards |
| Workflow Editor | Edit workflow settings, manage steps, configure routing rules |
| Execution Runner | Run a workflow — smart form fields based on input schema |
| Execution Tracker | Real-time status + step-by-step timeline for a single execution |
| Audit Log | Full history of all executions with status, duration, and delete |

---

## Key Technical Decisions

**BullMQ + Redis for async execution** — workflow runs are queued so the API responds immediately and the worker processes them in the background. This prevents long-running HTTP requests and enables retries.

**jexl for rule evaluation** — safe, sandboxed expression evaluation without `eval()`. Supports complex boolean logic against arbitrary JSON input.

**Prisma ORM** — type-safe database access with automatic migrations. Schema-first approach keeps the DB and TypeScript types in sync.

**React Query** — handles all server state, caching, and background refetching. The execution tracker uses polling to show live status updates.

**Separate worker process** — the BullMQ worker runs as a completely separate Node.js process from the API server. This keeps the API responsive even during heavy execution workloads.

---

## Infrastructure

```
User Browser
    │
    ▼
Netlify CDN (React SPA)
https://workflow-automation-system-1.netlify.app
    │
    │  HTTPS API calls
    ▼
Render Web Service (Express API)
https://workflow-automation-system-gmfq.onrender.com
    │
    ├──────────────────────────────┐
    ▼                              ▼
Neon PostgreSQL              Upstash Redis
(workflows, steps,           (BullMQ job queue)
 rules, executions)                │
                                   ▼
                         Render Worker Process
                         (BullMQ consumer)
                                   │
                                   ▼
                         Workflow Engine
                         (step-by-step execution
                          + rule evaluation)
```

---

## Sample Workflow — Expense Approval

Demonstrates multi-level approval routing based on amount, country, and priority.

```
Input: { amount: 250, country: "US", priority: "High", department: "Engineering" }

Step 1 — Manager Approval
  ├── amount > 100 && country == "US" && priority == "High"  →  Finance Notification ✓
  ├── amount <= 100 || department == "HR"                    →  CEO Approval
  ├── priority == "Low" && country != "US"                   →  Task Rejection
  └── DEFAULT                                                →  Task Rejection

Step 2 — Finance Notification
  ├── amount > 5000  →  CEO Approval
  └── DEFAULT        →  Task Completion ✓

Result: completed in 3 steps
```

---

## Contact

Built by Harenguruv — harenguruv@gmail.com
