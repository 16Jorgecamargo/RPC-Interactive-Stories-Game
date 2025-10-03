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
}
