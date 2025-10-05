import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  JsonRpcRequestSchema,
  JsonRpcSuccessResponseSchema,
  JsonRpcErrorResponseSchema,
  JSON_RPC_ERRORS,
  type JsonRpcRequest,
} from '../../models/jsonrpc_schemas.js';
import { methodRegistry } from './rpc_methods/index.js';
import { logRPCCall, logError } from '../../utils/logger.js';

const jsonRpcHandler: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc',
    schema: {
      tags: ['JSON-RPC'],
      summary: 'Endpoint único JSON-RPC 2.0',
      description: 'Processa chamadas RPC seguindo a especificação JSON-RPC 2.0. Use o campo "method" para especificar a ação desejada.',
      body: JsonRpcRequestSchema,
      response: {
        200: JsonRpcSuccessResponseSchema,
        400: JsonRpcErrorResponseSchema,
        401: JsonRpcErrorResponseSchema,
        500: JsonRpcErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const rpcRequest = request.body as JsonRpcRequest;
      const { jsonrpc, id, method, params } = rpcRequest;

      if (jsonrpc !== '2.0') {
        return reply.code(400).send({
          jsonrpc: '2.0',
          id: id || null,
          error: {
            ...JSON_RPC_ERRORS.INVALID_REQUEST,
            data: { reason: 'Campo jsonrpc deve ser "2.0"' },
          },
        });
      }

      const rpcMethod = methodRegistry[method as keyof typeof methodRegistry];

      if (!rpcMethod) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          id,
          error: {
            ...JSON_RPC_ERRORS.METHOD_NOT_FOUND,
            data: {
              method,
              availableMethods: Object.keys(methodRegistry),
            },
          },
        });
      }

      try {
        const startTime = Date.now();
        logRPCCall(method, params);

        const result = await rpcMethod((params || {}) as never);

        const duration = Date.now() - startTime;
        logRPCCall(method, params, duration);

        return reply.code(200).send({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (error: unknown) {
        const err = error as { code?: number; message?: string; data?: unknown; name?: string; errors?: unknown };

        if (err.code && err.message) {
          const statusCode = err.code === -32001 ? 401 : 400;
          logError(error, { method, statusCode, errorCode: err.code });
          return reply.code(statusCode).send({
            jsonrpc: '2.0',
            id,
            error: {
              code: err.code,
              message: err.message,
              data: err.data,
            },
          });
        }

        if (err.name === 'ZodError') {
          logError(error, { method, type: 'validation' });
          return reply.code(400).send({
            jsonrpc: '2.0',
            id,
            error: {
              ...JSON_RPC_ERRORS.INVALID_PARAMS,
              data: {
                validationErrors: err.errors,
              },
            },
          });
        }

        logError(error, { method, type: 'internal' });
        return reply.code(500).send({
          jsonrpc: '2.0',
          id,
          error: {
            ...JSON_RPC_ERRORS.INTERNAL_ERROR,
            data: {
              message: err.message || 'Erro interno do servidor',
            },
          },
        });
      }
    },
  });
};

export default jsonRpcHandler;
