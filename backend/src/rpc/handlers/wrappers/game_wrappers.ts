import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as gameService from '../../../services/game_service.js';
import {
  GetGameStateSchema,
  GetTimelineSchema,
  GameStateResponseSchema,
  TimelineResponseSchema,
} from '../../../models/game_schemas.js';

export async function registerGameWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/state',
    schema: {
      tags: ['Game'],
      summary: 'Obter estado atual do jogo',
      description:
        'Retorna o capítulo atual, opções disponíveis, participantes e votos. Apenas para sessões em andamento.',
      body: GetGameStateSchema,
      response: {
        200: GameStateResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await gameService.getGameState(request.body);
        return reply.send(result);
      } catch (error: any) {
        const statusCode = error.code === -32002 ? 403 : error.code === -32001 ? 401 : 400;
        return reply.code(statusCode).send({
          code: error.code,
          message: error.message,
          data: error.data,
        } as any);
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/timeline',
    schema: {
      tags: ['Game'],
      summary: 'Obter histórico da timeline',
      description: 'Retorna o histórico de capítulos visitados e decisões tomadas durante o jogo.',
      body: GetTimelineSchema,
      response: {
        200: TimelineResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await gameService.getTimelineHistory(request.body);
        return reply.send(result);
      } catch (error: any) {
        const statusCode = error.code === -32002 ? 403 : error.code === -32001 ? 401 : 400;
        return reply.code(statusCode).send({
          code: error.code,
          message: error.message,
          data: error.data,
        } as any);
      }
    },
  });
}
