import { evaluateStepRules } from './ruleEngine';

const makeRule = (
  id: string,
  condition: string,
  next_step_id: string | null,
  priority: number
) => ({ id, condition, next_step_id, priority });

describe('evaluateStepRules', () => {
  it('1. simple true condition matches', async () => {
    const rules = [makeRule('r1', 'amount > 100', 'step-2', 1)];
    const result = await evaluateStepRules(rules, { amount: 200 });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-2');
  });

  it('2. simple false condition does not match', async () => {
    const rules = [makeRule('r1', 'amount > 100', 'step-2', 1)];
    const result = await evaluateStepRules(rules, { amount: 50 });
    expect(result.matched).toBe(false);
    expect(result.nextStepId).toBeNull();
  });

  it('3. priority ordering — lower priority number evaluated first', async () => {
    const rules = [
      makeRule('r3', 'amount > 100', 'step-from-p3', 3),
      makeRule('r1', 'amount > 100', 'step-from-p1', 1), // false
      makeRule('r2', 'amount > 50', 'step-from-p2', 2),  // true
    ];
    // r1 (priority 1) is false (amount=80 > 100 is false), r2 (priority 2) is true
    const result = await evaluateStepRules(rules, { amount: 80 });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-from-p2');
  });

  it('4. DEFAULT fallback when all non-DEFAULT rules are false', async () => {
    const rules = [
      makeRule('r1', 'amount > 100', 'step-2', 1),
      makeRule('default', 'DEFAULT', 'step-default', 99),
    ];
    const result = await evaluateStepRules(rules, { amount: 50 });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-default');
  });

  it('5. DEFAULT not selected when a non-DEFAULT rule matches', async () => {
    const rules = [
      makeRule('r1', 'amount > 100', 'step-2', 1),
      makeRule('default', 'DEFAULT', 'step-default', 99),
    ];
    const result = await evaluateStepRules(rules, { amount: 200 });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-2');
  });

  it('6. faulty jexl expression is treated as non-matching and evaluation continues', async () => {
    const rules = [
      makeRule('r1', '!!!invalid((', 'step-bad', 1),
      makeRule('r2', 'amount > 10', 'step-good', 2),
    ];
    const result = await evaluateStepRules(rules, { amount: 50 });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-good');
    // The faulty rule should appear in logs with result: null and an error
    const faultyLog = result.logs.find((l) => l.ruleId === 'r1');
    expect(faultyLog).toBeDefined();
    expect(faultyLog!.result).toBeNull();
    expect(faultyLog!.error).toBeDefined();
  });

  it('7. no match and no DEFAULT returns matched: false, nextStepId: null', async () => {
    const rules = [
      makeRule('r1', 'amount > 100', 'step-2', 1),
      makeRule('r2', 'amount > 200', 'step-3', 2),
    ];
    const result = await evaluateStepRules(rules, { amount: 50 });
    expect(result.matched).toBe(false);
    expect(result.nextStepId).toBeNull();
  });

  it('8. compound condition matches correctly', async () => {
    const rules = [makeRule('r1', 'amount > 100 && country == "US"', 'step-2', 1)];
    const result = await evaluateStepRules(rules, { amount: 150, country: 'US' });
    expect(result.matched).toBe(true);
    expect(result.nextStepId).toBe('step-2');
  });

  it('8b. compound condition does not match when one part is false', async () => {
    const rules = [makeRule('r1', 'amount > 100 && country == "US"', 'step-2', 1)];
    const result = await evaluateStepRules(rules, { amount: 150, country: 'CA' });
    expect(result.matched).toBe(false);
  });

  it('9. logs completeness — every evaluated rule appears in logs with correct fields', async () => {
    const rules = [
      makeRule('r1', 'amount > 100', 'step-2', 1),
      makeRule('r2', 'amount > 50', 'step-3', 2),
    ];
    const result = await evaluateStepRules(rules, { amount: 80 });
    // r1 is false (80 > 100), r2 is true (80 > 50) — stops at r2
    expect(result.logs).toHaveLength(2);

    for (const log of result.logs) {
      expect(log.ruleId).toBeDefined();
      expect(log.condition).toBeDefined();
      expect(typeof log.result === 'boolean' || log.result === null).toBe(true);
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    }

    const r1Log = result.logs.find((l) => l.ruleId === 'r1');
    expect(r1Log!.result).toBe(false);

    const r2Log = result.logs.find((l) => l.ruleId === 'r2');
    expect(r2Log!.result).toBe(true);
  });
});
