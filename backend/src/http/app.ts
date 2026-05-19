// src/http/app.ts
import { Hono } from 'hono';
import type { UserRepository } from '../domain/user/UserRepository';
import type { EvaluationRepository } from '../domain/evaluation/EvaluationRepository';
import type { CourseRepository } from '../domain/course/CourseRepository';
import type { TokenService } from '../domain/auth/TokenService';
import type { Hasher } from '../domain/use-cases/signUp';
import type { PasswordVerifier } from '../domain/use-cases/login';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { buildAuthRoutes, buildMeRoute } from './routes/auth.routes';
import { buildEvaluationsRoutes } from './routes/evaluations.routes';
import { buildCoursesRoutes } from './routes/courses.routes';
import { buildHealthRoutes } from './routes/health.routes';

export interface AppDeps {
  userRepo: UserRepository;
  evaluationRepo: EvaluationRepository;
  courseRepo: CourseRepository;
  tokens: TokenService;
  hasher: Hasher;
  verifier: PasswordVerifier;
}

export function buildApp(deps: AppDeps) {
  const app = new Hono();
  app.onError(errorHandler);
  app.use('*', loggerMiddleware());

  app.route('/api/health', buildHealthRoutes());
  app.route('/api/auth', buildAuthRoutes(deps));

  app.use('/api/auth/me', authMiddleware(deps.tokens));
  app.route('/api/auth/me', buildMeRoute(deps));

  app.use('/api/evaluations/*', authMiddleware(deps.tokens));
  app.route('/api/evaluations', buildEvaluationsRoutes({ repo: deps.evaluationRepo }));

  app.on(['POST', 'PUT', 'DELETE'], '/api/courses/*', authMiddleware(deps.tokens));
  app.route('/api/courses', buildCoursesRoutes({ repo: deps.courseRepo }));

  return app;
}
