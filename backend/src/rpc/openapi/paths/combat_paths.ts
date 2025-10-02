import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  InitiateCombatSchema,
  InitiateCombatResponseSchema,
  GetCombatStateSchema,
  GetCombatStateResponseSchema,
} from '../../../models/combat_schemas.js';

export function registerCombatPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/combat/initiate',
    tags: ['Combat'],
    summary: 'Iniciar combate',
    description: 'Inicia um combate quando o capítulo atual é um nó de combate. Gera inimigos automaticamente baseado no texto do capítulo e prepara os personagens dos jogadores para a batalha.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: InitiateCombatSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Combate iniciado com sucesso',
        content: {
          'application/json': {
            schema: InitiateCombatResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro na requisição',
      },
      401: {
        description: 'Token inválido',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/combat/state',
    tags: ['Combat'],
    summary: 'Obter estado do combate',
    description: 'Retorna o estado atual do combate ativo na sessão, incluindo participantes, inimigos, ordem de turnos e turno atual.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetCombatStateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Estado do combate retornado com sucesso',
        content: {
          'application/json': {
            schema: GetCombatStateResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro na requisição',
      },
      401: {
        description: 'Token inválido',
      },
    },
  });
}
