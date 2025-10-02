import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as combatService from '../../../services/combat_service.js';
import {
  InitiateCombatSchema,
  GetCombatStateSchema,
  InitiateCombatResponseSchema,
  GetCombatStateResponseSchema,
} from '../../../models/combat_schemas.js';

export async function registerCombatWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/initiate',
    schema: {
      tags: ['Combat'],
      summary: 'Iniciar combate',
      description: 'Inicia um combate quando o capítulo atual é um nó de combate. Gera inimigos automaticamente baseado no texto do capítulo.',
      body: InitiateCombatSchema,
      response: {
        200: InitiateCombatResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.initiateCombat(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/state',
    schema: {
      tags: ['Combat'],
      summary: 'Obter estado do combate',
      description: 'Retorna o estado atual do combate ativo na sessão, incluindo participantes, inimigos e ordem de turnos.',
      body: GetCombatStateSchema,
      response: {
        200: GetCombatStateResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.getCombatState(request.body);
      return reply.send(result);
    },
  });
}
