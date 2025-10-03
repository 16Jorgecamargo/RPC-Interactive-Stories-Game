import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  RegisterSchema,
  LoginSchema,
  ValidateTokenSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
  ValidateTokenResponseSchema,
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
        400: { description: 'Erro de validação ou usuário já existe' },
        500: { description: 'Erro interno do servidor' },
      },
    },
    handler: async (request, reply) => {
      const result = await authService.register(request.body);
      return reply.send(result);
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
        400: { description: 'Credenciais inválidas' },
        500: { description: 'Erro interno do servidor' },
      },
    },
    handler: async (request, reply) => {
      const result = await authService.login(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/auth/validate',
    schema: {
      tags: ['Auth'],
      summary: 'Validar token JWT',
      description: 'Verifica se um token JWT é válido e retorna os dados do usuário. Internamente usa JSON-RPC 2.0 (method: "validateToken").',
      body: ValidateTokenSchema,
      response: {
        200: ValidateTokenResponseSchema,
        400: { description: 'Token inválido ou expirado' },
        500: { description: 'Erro interno do servidor' },
      },
    },
    handler: async (request, reply) => {
      const result = await authService.validateToken(request.body);
      return reply.send(result);
    },
  });
}
