// src/http/routes/evaluations.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { throwOnInvalid } from '../validatorHook';
import type { EvaluationRepository } from '../../domain/evaluation/EvaluationRepository';
import { createEvaluation } from '../../domain/use-cases/createEvaluation';
import { getEvaluation } from '../../domain/use-cases/getEvaluation';
import { listEvaluations } from '../../domain/use-cases/listEvaluations';
import { updateEvaluation } from '../../domain/use-cases/updateEvaluation';
import { deleteEvaluation } from '../../domain/use-cases/deleteEvaluation';
import {
  createEvaluationSchema, updateEvaluationSchema, listEvaluationsQuerySchema,
} from '../schemas';

export interface EvaluationsDeps { repo: EvaluationRepository; }
type Vars = { Variables: { userId: string; userEmail: string } };

export function buildEvaluationsRoutes(deps: EvaluationsDeps) {
  const r = new Hono<Vars>();

  r.get('/', zValidator('query', listEvaluationsQuerySchema, throwOnInvalid), async (c) => {
    const userId = c.get('userId');
    const q = c.req.valid('query');
    const result = await listEvaluations(deps)({ userId, ...q });
    return c.json(result);
  });

  r.get('/:id', async (c) => {
    const userId = c.get('userId');
    const evaluation = await getEvaluation(deps)({
      evaluationId: c.req.param('id'), userId,
    });
    return c.json({ evaluation });
  });

  r.post('/', zValidator('json', createEvaluationSchema, throwOnInvalid), async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const evaluation = await createEvaluation(deps)({ userId, ...body });
    return c.json({ evaluation }, 201);
  });

  r.put('/:id', zValidator('json', updateEvaluationSchema, throwOnInvalid), async (c) => {
    const userId = c.get('userId');
    const patch = c.req.valid('json');
    const evaluation = await updateEvaluation(deps)({
      evaluationId: c.req.param('id'), userId, patch,
    });
    return c.json({ evaluation });
  });

  r.delete('/:id', async (c) => {
    const userId = c.get('userId');
    await deleteEvaluation(deps)({ evaluationId: c.req.param('id'), userId });
    return c.body(null, 204);
  });

  return r;
}
