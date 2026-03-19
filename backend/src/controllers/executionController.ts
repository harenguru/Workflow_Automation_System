import { Request, Response, NextFunction } from 'express';
import * as executionService from '../services/executionService';

export async function listExecutions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const workflowId = req.query.workflow_id as string | undefined;
    const result = await executionService.listExecutions({ page, limit, workflowId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function triggerExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, triggered_by } = req.body;
    const execution = await executionService.triggerExecution(req.params.workflowId, {
      data,
      triggered_by,
    });
    res.status(201).json(execution);
  } catch (err) {
    next(err);
  }
}

export async function getExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const execution = await executionService.getExecution(req.params.id);
    res.status(200).json(execution);
  } catch (err) {
    next(err);
  }
}

export async function cancelExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const execution = await executionService.cancelExecution(req.params.id);
    res.status(200).json(execution);
  } catch (err) {
    next(err);
  }
}

export async function retryExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const execution = await executionService.retryExecution(req.params.id);
    res.status(201).json(execution);
  } catch (err) {
    next(err);
  }
}

export async function deleteExecution(req: Request, res: Response, next: NextFunction) {
  try {
    await executionService.deleteExecution(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
