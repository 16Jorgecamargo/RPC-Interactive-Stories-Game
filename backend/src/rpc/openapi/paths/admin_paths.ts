import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  GetAllUsersSchema,
  GetAllUsersResponseSchema,
  DeleteUserSchema,
  DeleteUserResponseSchema,
  PromoteUserSchema,
  PromoteUserResponseSchema,
  DemoteUserSchema,
  DemoteUserResponseSchema,
} from '../../../models/admin_schemas.js';

export function registerAdminPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/admin/users',
    tags: ['Admin'],
    summary: 'Listar todos os usuários',
    description: 'Retorna lista completa de usuários do sistema com estatísticas (total de sessões criadas, personagens criados e sessões ativas). Apenas administradores podem acessar. Wrapper REST que internamente chama o método RPC "getAllUsers".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetAllUsersSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Lista de usuários retornada com sucesso',
        content: {
          'application/json': {
            schema: GetAllUsersResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou ausente',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/admin/users/delete',
    tags: ['Admin'],
    summary: 'Excluir usuário',
    description: 'Exclui permanentemente um usuário e todos os seus dados relacionados em cascata: sessões criadas e personagens. **Importante**: Admin não pode excluir a própria conta. A resposta inclui informações sobre quantos itens foram excluídos. Wrapper REST que internamente chama o método RPC "deleteUser".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DeleteUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Usuário excluído com sucesso',
        content: {
          'application/json': {
            schema: DeleteUserResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou ausente',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/admin/users/promote',
    tags: ['Admin'],
    summary: 'Promover usuário a administrador',
    description: 'Concede privilégios de administrador a um usuário. Usuários admin podem gerenciar todos os aspectos do sistema. Wrapper REST que internamente chama o método RPC "promoteUser".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PromoteUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Usuário promovido com sucesso',
        content: {
          'application/json': {
            schema: PromoteUserResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou ausente',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/admin/users/demote',
    tags: ['Admin'],
    summary: 'Remover privilégios de admin',
    description: 'Remove privilégios de administrador de um usuário, tornando-o um usuário comum. **Importante**: Admin não pode remover os próprios privilégios. Wrapper REST que internamente chama o método RPC "demoteUser".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DemoteUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Privilégios removidos com sucesso',
        content: {
          'application/json': {
            schema: DemoteUserResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou ausente',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
    },
  });
}
