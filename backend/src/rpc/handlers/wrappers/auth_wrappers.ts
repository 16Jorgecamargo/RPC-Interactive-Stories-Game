import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  RegisterSchema,
  LoginSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
  UserResponseSchema,
} from '../../../models/auth_schemas.js';
import * as authService from '../../../services/auth_service.js';

export async function registerAuthWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/register',
    schema: {
      tags: ['Auth'],
      summary: 'Registrar novo usuário',
      description: 'Cria uma nova conta de usuário. Internamente usa JSON-RPC 2.0 (method: "register").',
      body: RegisterSchema,
      response: {
        200: RegisterResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await authService.register(request.body);
        return reply.code(200).send(result);
      } catch (error: any) {
        if (error.code && error.message) {
          const statusCode = error.code === -32001 ? 401 : 400;
          return reply.code(statusCode).send({
            success: false,
            message: error.message,
          });
        }
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/login',
    schema: {
      tags: ['Auth'],
      summary: 'Autenticar usuário',
      description: 'Realiza login e retorna JWT token. Internamente usa JSON-RPC 2.0 (method: "login").',
      body: LoginSchema,
      response: {
        200: LoginResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await authService.login(request.body);
        return reply.code(200).send(result);
      } catch (error: any) {
        if (error.code && error.message) {
          return reply.code(401).send({
            token: '',
            user: { id: '', username: '', role: 'USER' as const, createdAt: '' },
            expiresIn: 0,
          });
        }
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/rpc/me',
    schema: {
      tags: ['Auth'],
      summary: 'Obter dados do usuário autenticado',
      description: 'Retorna informações do usuário logado. Internamente usa JSON-RPC 2.0 (method: "me"). Requer header Authorization: Bearer <token>',
      response: {
        200: UserResponseSchema,
      },
    },
    preHandler: (app as any).authenticate,
    handler: async (request, reply) => {
      const { password: _, ...userWithoutPassword } = (request as any).user;
      return reply.code(200).send(userWithoutPassword);
    },
  });
}
