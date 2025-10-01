import { FastifyInstance } from 'fastify';
import { registerAuthWrappers } from './auth_wrappers.js';
import { registerHealthWrappers } from './health_wrappers.js';
import { registerUserWrappers } from './user_wrappers.js';

export async function registerAllWrappers(app: FastifyInstance) {
  await registerAuthWrappers(app);
  await registerHealthWrappers(app);
  await registerUserWrappers(app);
}
