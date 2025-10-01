import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  GetMeSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  ChangePasswordResponseSchema,
  UpdateProfileResponseSchema,
} from '../../../models/user_schemas.js';
import { UserResponseSchema } from '../../../models/auth_schemas.js';
import * as userService from '../../../services/user_service.js';

export async function registerUserWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/users/me',
    schema: {
      tags: ['Users'],
      summary: 'Obter dados do usuário logado',
      description:
        'Retorna os dados do usuário autenticado. Internamente usa JSON-RPC 2.0 (method: "me").',
      body: GetMeSchema,
      response: {
        200: UserResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await userService.getMe(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/rpc/users/me',
    schema: {
      tags: ['Users'],
      summary: 'Atualizar perfil do usuário',
      description:
        'Atualiza informações do perfil do usuário autenticado. Internamente usa JSON-RPC 2.0 (method: "updateProfile").',
      body: UpdateProfileSchema,
      response: {
        200: UpdateProfileResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await userService.updateProfile(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/users/change-password',
    schema: {
      tags: ['Users'],
      summary: 'Alterar senha do usuário',
      description:
        'Permite ao usuário autenticado alterar sua senha. Internamente usa JSON-RPC 2.0 (method: "changePassword").',
      body: ChangePasswordSchema,
      response: {
        200: ChangePasswordResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await userService.changePassword(request.body);
      return reply.send(result);
    },
  });
}
