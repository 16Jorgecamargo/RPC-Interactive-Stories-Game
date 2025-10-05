import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as updateService from '../../../services/update_service.js';
import {
  CheckGameUpdatesSchema,
  GameUpdatesResponseSchema,
  UpdatePlayerStatusSchema,
  PlayerStatusResponseSchema,
  CheckMessagesSchema,
} from '../../../models/update_schemas.js';
import { GetMessagesResponseSchema } from '../../../models/chat_schemas.js';

export async function registerUpdateWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/updates/check',
    schema: {
      tags: ['Updates'],
      summary: 'Verificar atualizações do jogo (long polling)',
      description:
        'Retorna atualizações de jogo desde lastUpdateId. Use para long polling de eventos em tempo real.',
      body: CheckGameUpdatesSchema,
      response: {
        200: GameUpdatesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await updateService.checkGameUpdates(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/updates/heartbeat',
    schema: {
      tags: ['Updates'],
      summary: 'Atualizar status de conexão (heartbeat)',
      description:
        'Registra atividade do jogador e atualiza lastActivity. Deve ser chamado periodicamente (ex: a cada 30s) para manter status online.',
      body: UpdatePlayerStatusSchema,
      response: {
        200: PlayerStatusResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await updateService.updatePlayerStatus(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/updates/messages',
    schema: {
      tags: ['Updates'],
      summary: 'Verificar novas mensagens (long polling)',
      description:
        'Retorna mensagens desde lastMessageId. Use para long polling de chat em tempo real.',
      body: CheckMessagesSchema,
      response: {
        200: GetMessagesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await updateService.checkMessages(request.body);
      return reply.send(result);
    },
  });
}
