import { authMethods } from './auth_methods.js';
import { healthMethods } from './health_methods.js';
import { userMethods } from './user_methods.js';
import { characterMethods } from './character_methods.js';
import { storyMethods } from './story_methods.js';
import { sessionMethods } from './session_methods.js';
import { gameMethods } from './game_methods.js';
import { voteMethods } from './vote_methods.js';
import { chatMethods } from './chat_methods.js';
import { updateMethods } from './update_methods.js';
import { combatMethods } from './combat_methods.js';

export const methodRegistry = {
  ...authMethods,
  ...healthMethods,
  ...userMethods,
  ...characterMethods,
  ...storyMethods,
  ...sessionMethods,
  ...gameMethods,
  ...voteMethods,
  ...chatMethods,
  ...updateMethods,
  ...combatMethods,
};
