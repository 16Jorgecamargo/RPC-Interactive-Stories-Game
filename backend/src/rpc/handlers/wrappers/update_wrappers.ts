import { FastifyInstance } from 'fastify';
import { methodRegistry } from '../rpc_methods/index.js';
import {
  CheckGameUpdatesSchema,
  GameUpdatesResponseSchema,
  UpdatePlayerStatusSchema,
  PlayerStatusResponseSchema,
  CheckMessagesSchema,
} from '../../../models/update_schemas.js';
import { GetMessagesResponseSchema } from '../../../models/chat_schemas.js';
import { z } from 'zod';

export async function registerUpdateWrappers(app: FastifyInstance) {
  app.post(
    '/rpc/updates/check',
    {
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
    },
    async (request, reply) => {
      const params = request.body as z.infer<typeof CheckGameUpdatesSchema>;
      try {
        const result = await methodRegistry.checkGameUpdates(params);
        return reply.send(result);
      } catch (error: unknown) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: (error as { code?: number })?.code || -32002,
            message:
              (error as { message?: string })?.message ||
              'Erro ao buscar atualizações',
          },
          id: null,
        });
      }
    }
  );

  app.post(
    '/rpc/updates/heartbeat',
    {
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
    },
    async (request, reply) => {
      const params = request.body as z.infer<typeof UpdatePlayerStatusSchema>;
      try {
        const result = await methodRegistry.updatePlayerStatus(params);
        return reply.send(result);
      } catch (error: unknown) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: (error as { code?: number })?.code || -32002,
            message:
              (error as { message?: string })?.message ||
              'Erro ao atualizar status',
          },
          id: null,
        });
      }
    }
  );

  app.post(
    '/rpc/updates/messages',
    {
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
    },
    async (request, reply) => {
      const params = request.body as z.infer<typeof CheckMessagesSchema>;
      try {
        const result = await methodRegistry.checkMessages(params);
        return reply.send(result);
      } catch (error: unknown) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: (error as { code?: number })?.code || -32002,
            message:
              (error as { message?: string })?.message ||
              'Erro ao buscar mensagens',
          },
          id: null,
        });
      }
    }
  );
}
