import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.workflow.findFirst({ where: { name: 'Employee Onboarding' } });
  if (existing) {
    await prisma.execution.deleteMany({ where: { workflow_id: existing.id } });
    await prisma.workflow.delete({ where: { id: existing.id } });
    console.log('Removed existing Employee Onboarding');
  }

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
  console.log('✓ Created "Employee Onboarding"');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
