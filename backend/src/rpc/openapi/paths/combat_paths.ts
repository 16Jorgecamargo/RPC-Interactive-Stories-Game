import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  InitiateCombatSchema,
  InitiateCombatResponseSchema,
  GetCombatStateSchema,
  GetCombatStateResponseSchema,
  RollInitiativeSchema,
  RollInitiativeResponseSchema,
  GetCurrentTurnSchema,
  GetCurrentTurnResponseSchema,
  PerformAttackSchema,
  PerformAttackResponseSchema,
  AttemptReviveSchema,
  AttemptReviveResponseSchema,
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

  registry.registerPath({
    method: 'post',
    path: '/rpc/combat/roll-initiative',
    tags: ['Combat'],
    summary: 'Rolar iniciativa',
    description: 'Rola D20 + modificador de Destreza para determinar a ordem de turnos. Quando todos os participantes rolam, inimigos rolam automaticamente e a ordem de turnos é estabelecida. Wrapper REST que internamente chama o método RPC "rollInitiative".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: RollInitiativeSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Iniciativa rolada com sucesso',
        content: {
          'application/json': {
            schema: RollInitiativeResponseSchema,
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
    path: '/rpc/combat/current-turn',
    tags: ['Combat'],
    summary: 'Obter turno atual',
    description: 'Retorna informações sobre o turno atual do combate: qual entidade (jogador ou inimigo) deve agir, índice do turno e total de participantes. Wrapper REST que internamente chama o método RPC "getCurrentTurn".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetCurrentTurnSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Turno atual retornado com sucesso',
        content: {
          'application/json': {
            schema: GetCurrentTurnResponseSchema,
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
    path: '/rpc/combat/attack',
    tags: ['Combat'],
    summary: 'Realizar ataque',
    description: 'Executa um ataque no combate com mecânica D&D: rola D20 + modificador vs Armor Class do alvo. **Natural 20** = crítico (dano dobrado). **Natural 1** = falha crítica (atacante recebe 1d4 de dano). Em caso de acerto, rola dado de dano baseado na classe do personagem (Warrior: 1d10, Rogue/Cleric: 1d8, Mage: 1d6). Wrapper REST que internamente chama o método RPC "performAttack".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PerformAttackSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ataque executado com sucesso',
        content: {
          'application/json': {
            schema: PerformAttackResponseSchema,
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
    path: '/rpc/combat/revive',
    tags: ['Combat'],
    summary: 'Tentar reviver personagem',
    description: 'Tenta ressuscitar um personagem morto no combate. Rola **2d10**, sucesso se soma **≥ 11**. Em caso de sucesso, personagem revive com **50% do HP máximo**. Máximo de **3 tentativas** por personagem. Após 3 falhas, personagem fica **permanentemente morto** e não pode mais ser revivido. Wrapper REST que internamente chama o método RPC "attemptRevive".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AttemptReviveSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Tentativa de ressurreição executada',
        content: {
          'application/json': {
            schema: AttemptReviveResponseSchema,
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
