import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  RegisterSchema,
  LoginSchema,
  ValidateTokenSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
  ValidateTokenResponseSchema,
  UserResponseSchema,
} from '../../../models/auth_schemas.js';

export function registerAuthPaths(registry: OpenAPIRegistry) {
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
      400: {
        description: 'Erro de validação - username já existe ou senhas não coincidem',
      },
      500: {
        description: 'Erro interno do servidor',
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
      401: {
        description: 'Credenciais inválidas - username ou senha incorretos',
      },
      500: {
        description: 'Erro interno do servidor',
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
      401: {
        description: 'Token inválido ou expirado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/auth/validate',
    tags: ['Auth'],
    summary: 'Validar token JWT',
    description: 'Verifica se um token JWT é válido e retorna os dados do usuário se válido. Wrapper REST que internamente chama o método RPC "validateToken".',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ValidateTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token validado com sucesso',
        content: {
          'application/json': {
            schema: ValidateTokenResponseSchema,
          },
        },
      },
      400: {
        description: 'Token inválido ou expirado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });
}
