import { runExecution } from './workflowEngine';

// Mock prisma
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    execution: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    step: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock ruleEngine
jest.mock('./ruleEngine', () => ({
  evaluateStepRules: jest.fn(),
}));

import prisma from '../lib/prisma';
import { evaluateStepRules } from './ruleEngine';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEvaluateStepRules = evaluateStepRules as jest.MockedFunction<typeof evaluateStepRules>;

function makeExecution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exec-1',
    workflow_id: 'wf-1',
    workflow_version: 1,
    data: { amount: 100 },
    status: 'pending',
    current_step_id: null,
    retries: 0,
    triggered_by: 'test',
    started_at: null,
    ended_at: null,
    logs: [],
    created_at: new Date(),
    updated_at: new Date(),
    workflow: {
      id: 'wf-1',
      name: 'Test Workflow',
      start_step_id: 'step-1',
      is_active: true,
      version: 1,
      description: null,
      input_schema: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    ...overrides,
  };
}

function makeStep(id: string, name: string, rules: unknown[] = []) {
  return {
    id,
    name,
    workflow_id: 'wf-1',
    step_type: 'task',
    index: 0,
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
    rules,
  };
}

function makeRuleEvalResult(matched: boolean, nextStepId: string | null) {
  return {
    matched,
    nextStepId,
    logs: [],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: update always resolves
  (mockPrisma.execution.update as jest.Mock).mockResolvedValue({});
});

describe('runExecution', () => {
  it('throws if execution not found', async () => {
    (mockPrisma.execution.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(runExecution('missing-id')).rejects.toThrow('Execution not found: missing-id');
  });

  it('single-step workflow: rule with next_step_id=null → status=completed', async () => {
    const execution = makeExecution();
    const step = makeStep('step-1', 'Step One', [{ id: 'r1', condition: 'DEFAULT', next_step_id: null, priority: 1 }]);

    (mockPrisma.execution.findUnique as jest.Mock)
      .mockResolvedValueOnce(execution)   // initial fetch
      .mockResolvedValueOnce({ status: 'in_progress' }); // cancel check

    (mockPrisma.step.findUnique as jest.Mock).mockResolvedValueOnce(step);
    mockEvaluateStepRules.mockResolvedValueOnce(makeRuleEvalResult(true, null));

    const result = await runExecution('exec-1');

    expect(result.status).toBe('completed');
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].type).toBe('step');
    expect(result.logs[0].stepId).toBe('step-1');
    expect(result.logs[0].nextStepId).toBeNull();
  });

  it('multi-step workflow: step1 → step2 → null → status=completed', async () => {
    const execution = makeExecution();
    const step1 = makeStep('step-1', 'Step One');
    const step2 = makeStep('step-2', 'Step Two');

    (mockPrisma.execution.findUnique as jest.Mock)
      .mockResolvedValueOnce(execution)             // initial fetch
      .mockResolvedValueOnce({ status: 'in_progress' }) // cancel check iter 1
      .mockResolvedValueOnce({ status: 'in_progress' }); // cancel check iter 2

    (mockPrisma.step.findUnique as jest.Mock)
      .mockResolvedValueOnce(step1)
      .mockResolvedValueOnce(step2);

    mockEvaluateStepRules
      .mockResolvedValueOnce(makeRuleEvalResult(true, 'step-2'))
      .mockResolvedValueOnce(makeRuleEvalResult(true, null));

    const result = await runExecution('exec-1');

    expect(result.status).toBe('completed');
    expect(result.logs).toHaveLength(2);
    expect(result.logs[0].stepId).toBe('step-1');
    expect(result.logs[0].nextStepId).toBe('step-2');
    expect(result.logs[1].stepId).toBe('step-2');
    expect(result.logs[1].nextStepId).toBeNull();
  });

  it('no matching rule → status=failed with reason "No matching rule"', async () => {
    const execution = makeExecution();
    const step = makeStep('step-1', 'Step One');

    (mockPrisma.execution.findUnique as jest.Mock)
      .mockResolvedValueOnce(execution)
      .mockResolvedValueOnce({ status: 'in_progress' });

    (mockPrisma.step.findUnique as jest.Mock).mockResolvedValueOnce(step);
    mockEvaluateStepRules.mockResolvedValueOnce(makeRuleEvalResult(false, null));

    const result = await runExecution('exec-1');

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('No matching rule');
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].type).toBe('step');
  });

  it('loop limit: always returns non-null nextStepId → status=failed with loop_limit log after 50 iterations', async () => {
    const execution = makeExecution();
    const step = makeStep('step-1', 'Step One');

    // First call: initial fetch; subsequent calls: cancel checks (51 of them)
    const findUniqueMocks = [execution];
    for (let i = 0; i < 50; i++) {
      findUniqueMocks.push({ status: 'in_progress' } as never);
    }
    (mockPrisma.execution.findUnique as jest.Mock).mockImplementation(() => {
      return Promise.resolve(findUniqueMocks.shift() ?? { status: 'in_progress' });
    });

    (mockPrisma.step.findUnique as jest.Mock).mockResolvedValue(step);
    mockEvaluateStepRules.mockResolvedValue(makeRuleEvalResult(true, 'step-1'));

    const result = await runExecution('exec-1');

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('Max iterations reached');
    const loopLimitLog = result.logs.find((l) => l.type === 'loop_limit');
    expect(loopLimitLog).toBeDefined();
    // Should have exactly 50 step logs + 1 loop_limit log
    const stepLogs = result.logs.filter((l) => l.type === 'step');
    expect(stepLogs).toHaveLength(50);
  });

  it('canceled execution: re-fetch returns canceled → exits with status=canceled', async () => {
    const execution = makeExecution();

    (mockPrisma.execution.findUnique as jest.Mock)
      .mockResolvedValueOnce(execution)         // initial fetch
      .mockResolvedValueOnce({ status: 'canceled' }); // cancel check

    const result = await runExecution('exec-1');

    expect(result.status).toBe('canceled');
    const cancelLog = result.logs.find((l) => l.type === 'cancel');
    expect(cancelLog).toBeDefined();
    // Step should NOT have been fetched since we canceled before processing
    expect(mockPrisma.step.findUnique).not.toHaveBeenCalled();
  });
});
