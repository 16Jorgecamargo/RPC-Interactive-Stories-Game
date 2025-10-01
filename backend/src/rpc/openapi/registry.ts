import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthPaths } from './paths/auth_paths.js';
import { registerRpcPaths } from './paths/rpc_paths.js';
import { registerHealthPaths } from './paths/health_paths.js';
import { registerUserPaths } from './paths/user_paths.js';

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
