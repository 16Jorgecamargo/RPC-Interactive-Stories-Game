import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { HealthResponseSchema } from '../../../models/jsonrpc_schemas.js';

export async function registerHealthWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Verifica saúde do servidor (wrapper REST). Internamente usa JSON-RPC 2.0 (method: "health").',
      response: {
        200: HealthResponseSchema,
      },
    },
    handler: async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    },
  });
}
