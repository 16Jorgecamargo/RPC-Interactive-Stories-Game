import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../../utils/jwt.js';
import { findById } from '../../stores/user_store.js';
import { User } from '../../models/auth_schemas.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || (request.body as any)?.token;

    if (!token) {
      return reply.code(401).send({
        error: {
          code: -32001,
          message: 'Token não fornecido',
        },
      });
    }

    const payload = verifyToken(token);
    const user = findById(payload.userId);

    if (!user) {
      return reply.code(401).send({
        error: {
          code: -32001,
          message: 'Usuário não encontrado',
        },
      });
    }

    request.user = user;
  } catch (error) {
    return reply.code(401).send({
      error: {
        code: -32001,
        message: 'Token inválido ou expirado',
      },
    });
  }
}
