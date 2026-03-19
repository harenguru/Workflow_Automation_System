import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_NAMES = ['Expense Approval', 'Employee Onboarding'];

async function main() {
  // Remove any existing seed workflows (handles duplicates too)
  const existing = await prisma.workflow.findMany({
    where: { name: { in: SEED_NAMES } },
    select: { id: true },
  });

  if (existing.length > 0) {
    const ids = existing.map((w) => w.id);
    // Delete executions first (FK constraint), then workflows (cascades steps+rules)
    await prisma.execution.deleteMany({ where: { workflow_id: { in: ids } } });
    await prisma.workflow.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${existing.length} existing seed workflow(s).`);
  }

  // ── Workflow 1: Expense Approval ─────────────────────────────────────────
  const expense = await prisma.workflow.create({
    data: {
      name: 'Expense Approval',
      description: 'Multi-level expense approval based on amount, country, and priority',
      is_active: true,
      input_schema: {
        type: 'object',
        properties: {
          amount:     { type: 'number' },
          country:    { type: 'string' },
          department: { type: 'string' },
          priority:   { type: 'string', allowed_values: ['High', 'Medium', 'Low'] },
        },
        required: ['amount', 'country', 'priority'],
      },
    },
  });

  const [exManager, exFinance, exCeo, exReject, exComplete] = await Promise.all([
    prisma.step.create({ data: { workflow_id: expense.id, name: 'Manager Approval',     step_type: 'approval',     index: 0, metadata: { assignee_email: 'manager@example.com' } } }),
    prisma.step.create({ data: { workflow_id: expense.id, name: 'Finance Notification', step_type: 'notification', index: 1, metadata: { notification_channel: 'email', template: 'finance-alert' } } }),
    prisma.step.create({ data: { workflow_id: expense.id, name: 'CEO Approval',         step_type: 'approval',     index: 2, metadata: { assignee_email: 'ceo@example.com' } } }),
    prisma.step.create({ data: { workflow_id: expense.id, name: 'Task Rejection',       step_type: 'task',         index: 3, metadata: { action: 'reject_expense' } } }),
    prisma.step.create({ data: { workflow_id: expense.id, name: 'Task Completion',      step_type: 'task',         index: 4, metadata: { action: 'complete_expense' } } }),
  ]);

  await prisma.rule.createMany({
    data: [
      { step_id: exManager.id, condition: 'amount > 100 && country == "US" && priority == "High"', next_step_id: exFinance.id,   priority: 1 },
      { step_id: exManager.id, condition: 'amount <= 100 || department == "HR"',                   next_step_id: exCeo.id,       priority: 2 },
      { step_id: exManager.id, condition: 'priority == "Low" && country != "US"',                  next_step_id: exReject.id,    priority: 3 },
      { step_id: exManager.id, condition: 'DEFAULT',                                               next_step_id: exReject.id,    priority: 4 },
      { step_id: exFinance.id, condition: 'amount > 5000',                                         next_step_id: exCeo.id,       priority: 1 },
      { step_id: exFinance.id, condition: 'DEFAULT',                                               next_step_id: exComplete.id,  priority: 2 },
      { step_id: exCeo.id,     condition: 'DEFAULT',                                               next_step_id: exComplete.id,  priority: 1 },
      { step_id: exReject.id,  condition: 'DEFAULT',                                               next_step_id: null,           priority: 1 },
      { step_id: exComplete.id,condition: 'DEFAULT',                                               next_step_id: null,           priority: 1 },
    ],
  });

  await prisma.workflow.update({ where: { id: expense.id }, data: { start_step_id: exManager.id } });
  console.log(`✓ Created "Expense Approval"`);

  // ── Workflow 2: Employee Onboarding ──────────────────────────────────────
  const onboarding = await prisma.workflow.create({
    data: {
      name: 'Employee Onboarding',
      description: 'Onboarding flow based on department and seniority',
      is_active: true,
      input_schema: {
        type: 'object',
        properties: {
          department:    { type: 'string' },
          seniority:     { type: 'string' },
          employee_name: { type: 'string' },
        },
        required: ['department'],
      },
    },
  });

  const [obInitial, obEngineering, obGeneral, obManager, obWelcome] = await Promise.all([
    prisma.step.create({ data: { workflow_id: onboarding.id, name: 'Initial Review',         step_type: 'task',         index: 0 } }),
    prisma.step.create({ data: { workflow_id: onboarding.id, name: 'Engineering Onboarding', step_type: 'task',         index: 1 } }),
    prisma.step.create({ data: { workflow_id: onboarding.id, name: 'General Onboarding',     step_type: 'task',         index: 2 } }),
    prisma.step.create({ data: { workflow_id: onboarding.id, name: 'Manager Approval',       step_type: 'approval',     index: 3, metadata: { assignee_email: 'manager@example.com' } } }),
    prisma.step.create({ data: { workflow_id: onboarding.id, name: 'Send Welcome Email',     step_type: 'notification', index: 4, metadata: { notification_channel: 'email' } } }),
  ]);

  await prisma.rule.createMany({
    data: [
      { step_id: obInitial.id,     condition: 'department == "engineering"', next_step_id: obEngineering.id, priority: 1 },
      { step_id: obInitial.id,     condition: 'DEFAULT',                     next_step_id: obGeneral.id,     priority: 2 },
      { step_id: obEngineering.id, condition: 'seniority == "senior"',       next_step_id: obManager.id,     priority: 1 },
      { step_id: obEngineering.id, condition: 'DEFAULT',                     next_step_id: obWelcome.id,     priority: 2 },
      { step_id: obGeneral.id,     condition: 'DEFAULT',                     next_step_id: obWelcome.id,     priority: 1 },
      { step_id: obManager.id,     condition: 'DEFAULT',                     next_step_id: obWelcome.id,     priority: 1 },
      { step_id: obWelcome.id,     condition: 'DEFAULT',                     next_step_id: null,             priority: 1 },
    ],
  });

  await prisma.workflow.update({ where: { id: onboarding.id }, data: { start_step_id: obInitial.id } });
  console.log(`✓ Created "Employee Onboarding"`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
