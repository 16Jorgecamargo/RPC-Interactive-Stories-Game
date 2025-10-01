import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  RegisterSchema,
  LoginSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
  UserResponseSchema,
} from '../models/auth_schemas.js';
import {
  JsonRpcRequestSchema,
  JsonRpcSuccessResponseSchema,
  JsonRpcErrorResponseSchema,
  HealthResponseSchema,
} from '../models/jsonrpc_schemas.js';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Insira o token JWT obtido no endpoint /rpc/login',
});

registry.registerPath({
  method: 'post',
  path: '/rpc/register',
  tags: ['Auth'],
  summary: 'Registrar novo usuário',
  description: 'Cria uma nova conta de usuário no sistema',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Usuário registrado com sucesso',
      content: {
        'application/json': {
          schema: RegisterResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/rpc/login',
  tags: ['Auth'],
  summary: 'Autenticar usuário',
  description: 'Realiza login e retorna JWT token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login realizado com sucesso',
      content: {
        'application/json': {
          schema: LoginResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/rpc/me',
  tags: ['Auth'],
  summary: 'Obter usuário autenticado',
  description: 'Retorna dados do usuário logado (rota protegida)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Dados do usuário',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
  },
});

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
  },
});
