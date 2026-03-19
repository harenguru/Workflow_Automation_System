import { Request, Response, NextFunction } from 'express';
import * as ruleService from '../services/ruleService';

export async function createRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { condition, next_step_id, priority } = req.body;
    const rule = await ruleService.createRule({
      step_id: req.params.stepId,
      condition,
      next_step_id,
      priority,
    });
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
}

export async function listRules(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await ruleService.listRules(req.params.stepId);
    res.status(200).json(rules);
  } catch (err) {
    next(err);
  }
}

export async function updateRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { condition, next_step_id, priority } = req.body;
    const rule = await ruleService.updateRule(req.params.id, { condition, next_step_id, priority });
    res.status(200).json(rule);
  } catch (err) {
    next(err);
  }
}

export async function reorderRulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { priorities } = req.body;
    const result = await ruleService.reorderRules(priorities);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteRule(req: Request, res: Response, next: NextFunction) {
  try {
    await ruleService.deleteRule(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
