import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  JsonRpcRequestSchema,
  JsonRpcSuccessResponseSchema,
  JsonRpcErrorResponseSchema,
} from '../../../models/jsonrpc_schemas.js';

export function registerRpcPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc',
    tags: ['JSON-RPC'],
    summary: 'Endpoint JSON-RPC 2.0',
    description: 'Endpoint único que processa todas as chamadas RPC seguindo a especificação JSON-RPC 2.0. Use o campo "method" para especificar a ação desejada (register, login, me, health, etc.)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: JsonRpcRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Resposta RPC bem-sucedida',
        content: {
          'application/json': {
            schema: JsonRpcSuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro RPC (request inválido, método não encontrado, parâmetros inválidos)',
        content: {
          'application/json': {
            schema: JsonRpcErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Erro de autenticação',
        content: {
          'application/json': {
            schema: JsonRpcErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Erro interno do servidor',
        content: {
          'application/json': {
            schema: JsonRpcErrorResponseSchema,
          },
        },
      },
    },
  });
}
