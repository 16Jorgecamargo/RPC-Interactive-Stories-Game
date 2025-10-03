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
  GetAllSessionsSchema,
  GetSessionDetailSchema,
  DeleteSessionSchema,
  ForceSessionStateSchema,
  GetSystemStatsSchema,
  GetStoryUsageSchema,
  GetAllSessionsResponseSchema,
  GetSessionDetailResponseSchema,
  DeleteSessionResponseSchema,
  ForceSessionStateResponseSchema,
  GetSystemStatsResponseSchema,
  GetStoryUsageResponseSchema,
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

  registry.registerPath({
    method: 'post',
    path: '/rpc/admin/sessions',
    tags: ['Admin'],
    summary: 'Listar todas as sessões',
    description: 'Retorna lista completa de sessões do sistema com detalhes (nome da história, dono, participantes, etc.). Suporta filtros opcionais por **status**, **ownerId** e **storyId**. Apenas administradores podem acessar. Wrapper REST que internamente chama o método RPC "getAllSessions".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetAllSessionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Lista de sessões retornada com sucesso',
        content: {
          'application/json': {
            schema: GetAllSessionsResponseSchema,
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
    path: '/rpc/admin/sessions/detail',
    tags: ['Admin'],
    summary: 'Obter detalhes completos da sessão',
    description: 'Retorna todos os detalhes de uma sessão específica incluindo votos atuais e informações completas. Wrapper REST que internamente chama o método RPC "getSessionDetail".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetSessionDetailSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Detalhes da sessão retornados com sucesso',
        content: {
          'application/json': {
            schema: GetSessionDetailResponseSchema,
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
    path: '/rpc/admin/sessions/delete',
    tags: ['Admin'],
    summary: 'Excluir sessão',
    description: 'Exclui permanentemente uma sessão e todos os personagens relacionados em cascata. A resposta inclui o número de personagens excluídos. Wrapper REST que internamente chama o método RPC "deleteSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DeleteSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sessão excluída com sucesso',
        content: {
          'application/json': {
            schema: DeleteSessionResponseSchema,
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
    path: '/rpc/admin/sessions/force-state',
    tags: ['Admin'],
    summary: 'Forçar mudança de estado',
    description: 'Força mudança do status de uma sessão para qualquer estado válido (WAITING_PLAYERS, CREATING_CHARACTERS, IN_PROGRESS, COMPLETED). Útil para corrigir sessões travadas ou em estado inconsistente. Wrapper REST que internamente chama o método RPC "forceSessionState".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ForceSessionStateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Estado da sessão alterado com sucesso',
        content: {
          'application/json': {
            schema: ForceSessionStateResponseSchema,
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
    path: '/rpc/admin/stats',
    tags: ['Admin'],
    summary: 'Obter estatísticas do sistema',
    description: 'Retorna estatísticas completas do sistema incluindo: **usuários** (total, admins, online), **sessões** (total, ativas, em andamento, completadas, média de jogadores), **personagens** (total, completos), **histórias** (total, mais jogada), **uptime** do servidor. Wrapper REST que internamente chama o método RPC "getSystemStats".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetSystemStatsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Estatísticas retornadas com sucesso',
        content: {
          'application/json': {
            schema: GetSystemStatsResponseSchema,
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
    path: '/rpc/admin/stories/usage',
    tags: ['Admin'],
    summary: 'Obter estatísticas de uso de história',
    description: 'Retorna estatísticas detalhadas de uma história específica: total de sessões (completadas e em andamento), total de jogadores únicos, média de jogadores por sessão, e **escolhas mais populares por capítulo** com percentuais de votos. Wrapper REST que internamente chama o método RPC "getStoryUsage".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetStoryUsageSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Estatísticas da história retornadas com sucesso',
        content: {
          'application/json': {
            schema: GetStoryUsageResponseSchema,
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
