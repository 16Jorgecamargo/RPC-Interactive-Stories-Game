import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthPaths } from './paths/auth_paths.js';
import { registerRpcPaths } from './paths/rpc_paths.js';
import { registerHealthPaths } from './paths/health_paths.js';
import { registerUserPaths } from './paths/user_paths.js';
import { registerCharacterPaths } from './paths/character_paths.js';
import { registerStoryPaths } from './paths/story_paths.js';
import { registerSessionPaths } from './paths/session_paths.js';
import { registerGamePaths } from './paths/game_paths.js';
import { registerVotePaths } from './paths/vote_paths.js';
import { registerChatPaths } from './paths/chat_paths.js';
import { registerUpdatePaths } from './paths/update_paths.js';
import { registerCombatPaths } from './paths/combat_paths.js';
import { registerAdminPaths } from './paths/admin_paths.js';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Insira o token JWT obtido no endpoint /rpc/login',
});

registerAuthPaths(registry);
registerRpcPaths(registry);
registerHealthPaths(registry);
registerUserPaths(registry);
registerCharacterPaths(registry);
registerStoryPaths(registry);
registerSessionPaths(registry);
registerGamePaths(registry);
registerVotePaths(registry);
registerChatPaths(registry);
registerUpdatePaths(registry);
registerCombatPaths(registry);
registerAdminPaths(registry);
