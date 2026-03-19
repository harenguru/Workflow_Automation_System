import { Request, Response, NextFunction } from 'express';
import * as workflowService from '../services/workflowService';

export async function createWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, input_schema } = req.body;
    const workflow = await workflowService.createWorkflow({ name, description, input_schema });
    res.status(201).json(workflow);
  } catch (err) {
    next(err);
  }
}

export async function listWorkflows(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = req.query.search as string | undefined;
    const result = await workflowService.listWorkflows({ page, limit, search });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    res.status(200).json(workflow);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, is_active, input_schema, start_step_id } = req.body;
    const workflow = await workflowService.updateWorkflow(req.params.id, {
      name, description, is_active, input_schema, start_step_id,
    });
    res.status(200).json(workflow);
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
