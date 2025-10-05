import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as adminService from '../../../services/admin_service.js';
import {
  GetAllUsersSchema,
  DeleteUserSchema,
  PromoteUserSchema,
  DemoteUserSchema,
  GetAllUsersResponseSchema,
  DeleteUserResponseSchema,
  PromoteUserResponseSchema,
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

export async function registerAdminWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/users',
    schema: {
      tags: ['Admin'],
      summary: 'Listar todos os usuários',
      description: 'Retorna lista de todos os usuários do sistema com estatísticas (total de sessões, personagens e sessões ativas). Requer privilégios de admin.',
      body: GetAllUsersSchema,
      response: {
        200: GetAllUsersResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.getAllUsers(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/users/delete',
    schema: {
      tags: ['Admin'],
      summary: 'Excluir usuário',
      description: 'Exclui um usuário e todos os seus dados relacionados (sessões e personagens) em cascata. Admin não pode excluir a própria conta. Requer privilégios de admin.',
      body: DeleteUserSchema,
      response: {
        200: DeleteUserResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.deleteUser(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/users/promote',
    schema: {
      tags: ['Admin'],
      summary: 'Promover usuário a admin',
      description: 'Concede privilégios de administrador a um usuário. Requer privilégios de admin.',
      body: PromoteUserSchema,
      response: {
        200: PromoteUserResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.promoteUser(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/users/demote',
    schema: {
      tags: ['Admin'],
      summary: 'Remover privilégios de admin',
      description: 'Remove privilégios de administrador de um usuário. Admin não pode remover os próprios privilégios. Requer privilégios de admin.',
      body: DemoteUserSchema,
      response: {
        200: DemoteUserResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.demoteUser(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/sessions',
    schema: {
      tags: ['Admin'],
      summary: 'Listar todas as sessões',
      description: 'Retorna lista de todas as sessões do sistema com detalhes. Suporta filtros por status, ownerId e storyId. Requer privilégios de admin.',
      body: GetAllSessionsSchema,
      response: {
        200: GetAllSessionsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.getAllSessions(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/sessions/detail',
    schema: {
      tags: ['Admin'],
      summary: 'Obter detalhes completos da sessão',
      description: 'Retorna todos os detalhes de uma sessão específica incluindo votos atuais. Requer privilégios de admin.',
      body: GetSessionDetailSchema,
      response: {
        200: GetSessionDetailResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.getSessionDetail(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/sessions/delete',
    schema: {
      tags: ['Admin'],
      summary: 'Excluir sessão',
      description: 'Exclui uma sessão e todos os personagens relacionados em cascata. Requer privilégios de admin.',
      body: DeleteSessionSchema,
      response: {
        200: DeleteSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.deleteSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/sessions/force-state',
    schema: {
      tags: ['Admin'],
      summary: 'Forçar mudança de estado',
      description: 'Força mudança do status de uma sessão para qualquer estado válido. Útil para corrigir sessões travadas. Requer privilégios de admin.',
      body: ForceSessionStateSchema,
      response: {
        200: ForceSessionStateResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.forceSessionState(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/stats',
    schema: {
      tags: ['Admin'],
      summary: 'Obter estatísticas do sistema',
      description: 'Retorna estatísticas completas do sistema: usuários, sessões, personagens, histórias e uptime. Requer privilégios de admin.',
      body: GetSystemStatsSchema,
      response: {
        200: GetSystemStatsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.getSystemStats(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/admin/stories/usage',
    schema: {
      tags: ['Admin'],
      summary: 'Obter estatísticas de uso de história',
      description: 'Retorna estatísticas detalhadas de uma história: sessões, jogadores e escolhas mais populares por capítulo. Requer privilégios de admin.',
      body: GetStoryUsageSchema,
      response: {
        200: GetStoryUsageResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await adminService.getStoryUsage(request.body);
      return reply.send(result);
    },
  });
}
