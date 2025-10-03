import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { HealthResponseSchema } from '../../../models/jsonrpc_schemas.js';

export function registerHealthPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Health check endpoint',
    description: 'Verifica saúde do servidor (wrapper REST). Internamente usa JSON-RPC 2.0 (method: "health").',
    responses: {
      200: {
        description: 'Servidor operacional',
        content: {
          'application/json': {
            schema: HealthResponseSchema,
          },
        },
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });
}
