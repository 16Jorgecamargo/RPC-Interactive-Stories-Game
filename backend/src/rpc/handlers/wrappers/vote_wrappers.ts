import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as voteService from '../../../services/vote_service.js';
import {
  SubmitVoteSchema,
  GetVoteStatusSchema,
  ResolveTieSchema,
  ConfigureVoteTimeoutSchema,
  GetVoteTimerSchema,
  ExtendVoteTimerSchema,
  SubmitVoteResponseSchema,
  VoteStatusResponseSchema,
  ResolveTieResponseSchema,
  ConfigureVoteTimeoutResponseSchema,
  GetVoteTimerResponseSchema,
  ExtendVoteTimerResponseSchema,
} from '../../../models/vote_schemas.js';

export async function registerVoteWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/vote',
    schema: {
      tags: ['Vote'],
      summary: 'Registrar voto em opção',
      description:
        'Permite que um jogador vote em uma opção do capítulo atual. Se todos votarem, a votação é finalizada automaticamente.',
      body: SubmitVoteSchema,
      response: {
        200: SubmitVoteResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.submitVote(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/vote-status',
    schema: {
      tags: ['Vote'],
      summary: 'Obter status da votação',
      description:
        'Retorna o status atual da votação: total de votos, participantes pendentes, contagem por opção.',
      body: GetVoteStatusSchema,
      response: {
        200: VoteStatusResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.getVotingStatus(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/resolve-tie',
    schema: {
      tags: ['Vote'],
      summary: 'Resolver empate em votação',
      description:
        'Permite que o mestre da sessão resolva um empate manualmente usando uma estratégia (RANDOM, MASTER_DECIDES).',
      body: ResolveTieSchema,
      response: {
        200: ResolveTieResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.resolveTie(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/configure-vote-timeout',
    schema: {
      tags: ['Vote'],
      summary: 'Configurar timer de votação',
      description:
        'Permite que o mestre configure a duração do timer de votação (1-60 segundos). Apenas o owner da sessão pode configurar.',
      body: ConfigureVoteTimeoutSchema,
      response: {
        200: ConfigureVoteTimeoutResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.configureVoteTimeout(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/vote-timer',
    schema: {
      tags: ['Vote'],
      summary: 'Obter status do timer de votação',
      description:
        'Retorna o status atual do timer: tempo restante, se está ativo, timestamps, etc.',
      body: GetVoteTimerSchema,
      response: {
        200: GetVoteTimerResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.getVoteTimer(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/game/extend-vote-timer',
    schema: {
      tags: ['Vote'],
      summary: 'Estender timer de votação',
      description:
        'Permite estender o timer de votação adicionando 1-30 segundos extras. Qualquer participante pode estender.',
      body: ExtendVoteTimerSchema,
      response: {
        200: ExtendVoteTimerResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await voteService.extendVoteTimer(request.body);
      return reply.send(result);
    },
  });
}
