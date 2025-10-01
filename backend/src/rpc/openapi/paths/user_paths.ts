import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  GetMeSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  ChangePasswordResponseSchema,
  UpdateProfileResponseSchema,
} from '../../../models/user_schemas.js';
import { UserResponseSchema } from '../../../models/auth_schemas.js';

export function registerUserPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/users/me',
    tags: ['Users'],
    summary: 'Obter dados do usuário logado',
    description:
      'Retorna os dados do usuário autenticado. Wrapper REST que internamente chama o método RPC "me".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetMeSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Dados do usuário logado',
        content: {
          'application/json': {
            schema: UserResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/rpc/users/me',
    tags: ['Users'],
    summary: 'Atualizar perfil do usuário',
    description:
      'Atualiza informações do perfil do usuário autenticado. Wrapper REST que internamente chama o método RPC "updateProfile".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateProfileSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Perfil atualizado com sucesso',
        content: {
          'application/json': {
            schema: UpdateProfileResponseSchema,
          },
        },
      },
      400: {
        description: 'Username já em uso',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/users/change-password',
    tags: ['Users'],
    summary: 'Alterar senha do usuário',
    description:
      'Permite ao usuário autenticado alterar sua senha. Wrapper REST que internamente chama o método RPC "changePassword".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ChangePasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Senha alterada com sucesso',
        content: {
          'application/json': {
            schema: ChangePasswordResponseSchema,
          },
        },
      },
      400: {
        description: 'Senhas não coincidem',
      },
      401: {
        description: 'Token inválido ou senha atual incorreta',
      },
    },
  });
}
