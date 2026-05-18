import { handle } from 'hono/aws-lambda';
import { composeApp } from './composition';

const app = composeApp();
export const handler = handle(app);
