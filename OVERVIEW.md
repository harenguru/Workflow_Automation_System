Dynamic Workflow Automation System

This document outlines the architecture and workflow of the Dynamic Workflow Automation System. The system is designed around a seamless transition from workflow design to automated execution and real-time tracking.


1. Simple Idea

"User designs a workflow → defines rules → executes with input → tracks every step"

By combining a visual workflow builder with a rule-driven execution engine, the platform lets users automate multi-step processes with conditional branching, approvals, notifications, and task completions — all tracked in real time.


2. Complete Workflow

Step 1: Initial State

When users first load the application, the dashboard shows any existing workflows stored in the database.
Two sample workflows are pre-seeded: Expense Approval and Employee Onboarding.
The Audit Log starts empty until executions are triggered.

Step 2: Create a Workflow

Users navigate to the Dashboard and click "New Workflow".
A modal opens where they enter a workflow name.
Once created, the workflow appears in the table with version 1 and status Active.
Users can then open the Workflow Editor to configure it further.

Step 3: Build the Workflow in the Editor

Inside the Workflow Editor, users can:
- Edit the workflow name and input schema (defines what fields the workflow expects at runtime).
- Add steps of three types: Task (automated action), Approval (requires a user decision), Notification (sends an alert).
- Each step has a name, type, order, and optional metadata like assignee email or notification channel.

Step 4: Define Rules for Each Step

Each step can have multiple rules that decide which step runs next based on the input data.
Rules are written as logical expressions like: amount > 100 && country == 'US' && priority == 'High'
Rules are evaluated in priority order — the first one that matches wins.
A DEFAULT rule acts as a fallback when no other condition matches.
Users can drag and drop rules to reorder their priority.

Step 5: Execute the Workflow

Users navigate to the Execute page for a workflow and fill in the required input fields defined by the input schema.
Clicking "Start Execution" sends the input to the backend, which enqueues a job via BullMQ into Redis.
The worker process picks up the job and starts running the workflow engine step by step.

Step 6: Track Execution in Real Time

The Execution Tracker page polls the backend and shows live status updates.
For each completed step it shows:
- Which rules were evaluated and whether they matched.
- Which step was selected next.
- The step status, duration, and any error messages.
The overall execution moves through states: pending → in_progress → completed / failed / canceled.

Step 7: Audit Log

The Audit Log page shows a full history of all executions across all workflows.
Each row shows the workflow name, version, status, who triggered it, and start/end times.
Users can click "View Logs" to inspect the full step-by-step log for any past execution.
Failed executions can be retried directly from the tracker, which creates a new run with the same input.


3. Architectural Tech Stack

Frontend: React + Vite, Tailwind CSS
Routing: React Router (/ for Dashboard, /workflows/:id/edit for Editor, /workflows/:id/execute for Runner, /executions/:id for Tracker, /audit for Audit Log)
State and Data Fetching: TanStack React Query
Backend Services: Node.js, Express, TypeScript
Database Engine: Prisma ORM, PostgreSQL (hosted on Neon)
Queue and Worker: BullMQ with Redis (hosted on Upstash)
Rule Engine: jexl expression evaluator for dynamic condition matching
