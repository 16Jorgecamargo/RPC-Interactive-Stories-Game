import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as voteService from '../../../services/vote_service.js';
import {
  SubmitVoteSchema,
  GetVoteStatusSchema,
  ResolveTieSchema,
  SubmitVoteResponseSchema,
  VoteStatusResponseSchema,
  ResolveTieResponseSchema,
} from '../../../models/vote_schemas.js';

export async function registerVoteWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/vote',
    schema: {
      tags: ['Voting'],
      summary: 'Registrar voto em opção',
      description:
        'Permite que um jogador vote em uma opção do capítulo atual. Se todos votarem, a votação é finalizada automaticamente.',
      body: SubmitVoteSchema,
      response: {
        200: SubmitVoteResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await voteService.submitVote(request.body);
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
    url: '/rpc/game/vote-status',
    schema: {
      tags: ['Voting'],
      summary: 'Obter status da votação',
      description:
        'Retorna o status atual da votação: total de votos, participantes pendentes, contagem por opção.',
      body: GetVoteStatusSchema,
      response: {
        200: VoteStatusResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await voteService.getVotingStatus(request.body);
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
    url: '/rpc/game/resolve-tie',
    schema: {
      tags: ['Voting'],
      summary: 'Resolver empate em votação',
      description:
        'Permite que o mestre da sessão resolva um empate manualmente usando uma estratégia (RANDOM, MASTER_DECIDES).',
      body: ResolveTieSchema,
      response: {
        200: ResolveTieResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await voteService.resolveTie(request.body);
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
