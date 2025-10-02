import { FastifyInstance } from 'fastify';
import { registerAuthWrappers } from './auth_wrappers.js';
import { registerHealthWrappers } from './health_wrappers.js';
import { registerUserWrappers } from './user_wrappers.js';
import { registerCharacterWrappers } from './character_wrappers.js';
import { registerStoryWrappers } from './story_wrappers.js';
import { registerSessionWrappers } from './session_wrappers.js';

export async function registerAllWrappers(app: FastifyInstance) {
  await registerAuthWrappers(app);
  await registerHealthWrappers(app);
  await registerUserWrappers(app);
  await registerCharacterWrappers(app);
  await registerStoryWrappers(app);
  await registerSessionWrappers(app);
}
