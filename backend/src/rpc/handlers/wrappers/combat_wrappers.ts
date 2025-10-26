import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as combatService from '../../../services/combat_service.js';
import {
  InitiateCombatSchema,
  GetCombatStateSchema,
  RollInitiativeSchema,
  GetCurrentTurnSchema,
  PerformAttackSchema,
  AttemptReviveSchema,
  SkipTurnSchema,
  InitiateCombatResponseSchema,
  GetCombatStateResponseSchema,
  RollInitiativeResponseSchema,
  GetCurrentTurnResponseSchema,
  PerformAttackResponseSchema,
  AttemptReviveResponseSchema,
  SkipTurnResponseSchema,
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/roll-initiative',
    schema: {
      tags: ['Combat'],
      summary: 'Rolar iniciativa',
      description: 'Rola D20 + modificador de Destreza para determinar a ordem de turnos. Quando todos os participantes rolam, inimigos rolam automaticamente e a ordem de turnos é estabelecida.',
      body: RollInitiativeSchema,
      response: {
        200: RollInitiativeResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.rollInitiative(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/current-turn',
    schema: {
      tags: ['Combat'],
      summary: 'Obter turno atual',
      description: 'Retorna informações sobre o turno atual do combate: qual entidade (jogador ou inimigo) deve agir, índice do turno e total de participantes.',
      body: GetCurrentTurnSchema,
      response: {
        200: GetCurrentTurnResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.getCurrentTurn(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/attack',
    schema: {
      tags: ['Combat'],
      summary: 'Realizar ataque',
      description: 'Executa um ataque no combate: rola D20 vs AC do alvo. Natural 20 = crítico (dano dobrado). Natural 1 = falha crítica (atacante recebe 1d4 de dano). Em caso de acerto, rola dado de dano baseado na classe do personagem.',
      body: PerformAttackSchema,
      response: {
        200: PerformAttackResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.performAttack(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/skip-turn',
    schema: {
      tags: ['Combat'],
      summary: 'Pular turno do personagem',
      description: 'Permite que o personagem pule o turno atual, recuperando uma pequena quantidade de HP e avançando para o próximo combatente.',
      body: SkipTurnSchema,
      response: {
        200: SkipTurnResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.skipTurn(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/combat/revive',
    schema: {
      tags: ['Combat'],
      summary: 'Tentar reviver personagem',
      description: 'Tenta ressuscitar um personagem morto rolando 2d10. Sucesso se soma ≥ 11. Personagem revive com 50% do HP máximo. Máximo de 3 tentativas por personagem. Após 3 falhas, personagem fica permanentemente morto.',
      body: AttemptReviveSchema,
      response: {
        200: AttemptReviveResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await combatService.attemptRevive(request.body);
      return reply.send(result);
    },
  });
}
