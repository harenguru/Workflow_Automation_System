import { Request, Response, NextFunction } from 'express';
import * as stepService from '../services/stepService';

type StepType = 'task' | 'approval' | 'notification';

export async function createStep(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, step_type, index, metadata } = req.body;
    const step = await stepService.createStep({
      workflow_id: req.params.workflowId,
      name,
      step_type: step_type as StepType,
      index,
      metadata,
    });
    res.status(201).json(step);
  } catch (err) {
    next(err);
  }
}

export async function listSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const steps = await stepService.listSteps(req.params.workflowId);
    res.status(200).json(steps);
  } catch (err) {
    next(err);
  }
}

export async function updateStep(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, step_type, index, metadata } = req.body;
    const step = await stepService.updateStep(req.params.id, {
      name,
      step_type: step_type as StepType | undefined,
      index,
      metadata,
    });
    res.status(200).json(step);
  } catch (err) {
    next(err);
  }
}

export async function deleteStep(req: Request, res: Response, next: NextFunction) {
  try {
    await stepService.deleteStep(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
