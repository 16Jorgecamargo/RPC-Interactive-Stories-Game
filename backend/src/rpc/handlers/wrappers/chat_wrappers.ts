import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as chatService from '../../../services/chat_service.js';
import {
  SendMessageSchema,
  GetMessagesSchema,
  SendMessageResponseSchema,
  GetMessagesResponseSchema,
} from '../../../models/chat_schemas.js';

export async function registerChatWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/chat/send',
    schema: {
      tags: ['Chat'],
      summary: 'Enviar mensagem no chat da sessão',
      description: 'Envia uma mensagem de chat na sessão. A mensagem é sanitizada para evitar XSS. Validações: sessão existe, personagem pertence ao jogador e à sessão, sessão não está completada.',
      body: SendMessageSchema,
      response: {
        200: SendMessageResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await chatService.sendMessage(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/rpc/chat/messages',
    schema: {
      tags: ['Chat'],
      summary: 'Buscar mensagens do chat',
      description: 'Retorna mensagens do chat da sessão. Suporta paginação e long polling via parâmetro `since`. Validações: sessão existe, jogador participa da sessão.',
      querystring: GetMessagesSchema,
      response: {
        200: GetMessagesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await chatService.getMessages(request.query);
      return reply.send(result);
    },
  });
}
