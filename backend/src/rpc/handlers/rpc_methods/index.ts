import { authMethods } from './auth_methods.js';
import { healthMethods } from './health_methods.js';
import { userMethods } from './user_methods.js';
import { characterMethods } from './character_methods.js';
import { storyMethods } from './story_methods.js';

export const methodRegistry = {
  ...authMethods,
  ...healthMethods,
  ...userMethods,
  ...characterMethods,
  ...storyMethods,
};
