import { DynamoEvaluationRepository } from './adapters/persistence/DynamoEvaluationRepository';
import { DynamoUserRepository } from './adapters/persistence/DynamoUserRepository';
import { JwtTokenService } from './adapters/auth/JwtTokenService';
import { BcryptHasher } from './adapters/auth/bcryptHasher';
import { buildApp } from './http/app';
import { makeDocClient } from './adapters/persistence/dynamoClient';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Required env var ${name} is missing`);
  return v;
}

export function composeApp() {
  const doc = makeDocClient(process.env.DDB_ENDPOINT);
  const evaluationRepo = new DynamoEvaluationRepository(required('EVALUATIONS_TABLE'), doc);
  const userRepo = new DynamoUserRepository(required('USERS_TABLE'), doc);
  const tokens = new JwtTokenService(required('JWT_SECRET'), { accessTtl: '15m', refreshTtl: '7d' });
  const hasher = new BcryptHasher();
  return buildApp({ evaluationRepo, userRepo, tokens, hasher, verifier: hasher });
}
