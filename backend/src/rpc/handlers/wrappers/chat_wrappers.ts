import { FastifyInstance } from 'fastify';
import { methodRegistry } from '../rpc_methods/index.js';
import {
  SendMessageSchema,
  GetMessagesSchema,
  SendMessageResponseSchema,
  GetMessagesResponseSchema,
} from '../../../models/chat_schemas.js';
import { z } from 'zod';

export async function registerChatWrappers(app: FastifyInstance) {
  app.post(
    '/rpc/chat/send',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Enviar mensagem no chat da sessão',
        description: 'Envia uma mensagem de chat na sessão. A mensagem é sanitizada para evitar XSS.',
        body: SendMessageSchema,
        response: {
          200: SendMessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.body as z.infer<typeof SendMessageSchema>;
      try {
        const result = await methodRegistry.sendMessage(params);
        return reply.send(result);
      } catch (error: unknown) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: (error as { code?: number })?.code || -32002,
            message: (error as { message?: string })?.message || 'Erro ao enviar mensagem',
          },
          id: null,
        });
      }
    }
  );

  app.get(
    '/rpc/chat/messages',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Buscar mensagens do chat',
        description: 'Retorna mensagens do chat da sessão. Suporta paginação e long polling via parâmetro `since`.',
        querystring: GetMessagesSchema,
        response: {
          200: GetMessagesResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.query as z.infer<typeof GetMessagesSchema>;
      try {
        const result = await methodRegistry.getMessages(params);
        return reply.send(result);
      } catch (error: unknown) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: (error as { code?: number })?.code || -32002,
            message: (error as { message?: string })?.message || 'Erro ao buscar mensagens',
          },
          id: null,
        });
      }
    }
  );
}
