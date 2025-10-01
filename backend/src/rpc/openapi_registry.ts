import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { RegisterSchema, LoginSchema, RegisterResponseSchema, LoginResponseSchema, UserResponseSchema } from '../models/auth_schemas.js';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Insira o token JWT obtido no endpoint /rpc/login'
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
