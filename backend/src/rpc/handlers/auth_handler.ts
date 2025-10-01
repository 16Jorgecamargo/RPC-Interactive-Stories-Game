import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  RegisterSchema,
  LoginSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
  UserResponseSchema
} from '../../models/auth_schemas.js';
import { hashPassword, comparePassword } from '../../utils/bcrypt.js';
import { signToken, getExpiresInSeconds } from '../../utils/jwt.js';
import { createUser, findByUsername, userExists } from '../../stores/user_store.js';

const authHandler: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/register',
    schema: {
      body: RegisterSchema,
      response: {
        200: RegisterResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { username, password, confirmPassword } = request.body;

      if (password !== confirmPassword) {
        return reply.code(400).send({
          success: false,
          message: 'Senhas não coincidem'
        });
      }

      if (userExists(username)) {
        return reply.code(400).send({
          success: false,
          message: 'Usuário já existe'
        });
      }

      const passwordHash = await hashPassword(password);
      const user = createUser(username, passwordHash);

      return {
        success: true,
        userId: user.id
      };
    }
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/login',
    schema: {
      body: LoginSchema,
      response: {
        200: LoginResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { username, password } = request.body;

      const user = findByUsername(username);

      if (!user) {
        return reply.code(401).send({
          token: '',
          user: { id: '', username: '', role: 'USER' as const, createdAt: '' },
          expiresIn: 0
        });
      }

      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        return reply.code(401).send({
          token: '',
          user: { id: '', username: '', role: 'USER' as const, createdAt: '' },
          expiresIn: 0
        });
      }

      const token = signToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      const { password: _, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
        expiresIn: getExpiresInSeconds()
      };
    }
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/rpc/me',
    schema: {
      response: {
        200: UserResponseSchema
      }
    },
    preHandler: (app as any).authenticate,
    handler: async (request, reply) => {
      const { password: _, ...userWithoutPassword } = request.user;
      return userWithoutPassword;
    }
  });
};

export default authHandler;
