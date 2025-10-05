import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  GetGameStateSchema,
  GetTimelineSchema,
  GameStateResponseSchema,
  TimelineResponseSchema,
} from '../../../models/game_schemas.js';

export function registerGamePaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/game/state',
    tags: ['Game'],
    summary: 'Obter estado atual do jogo',
    description:
      'Retorna o capítulo atual com texto narrativo, opções de escolha, lista de participantes e votos atuais. Detecta automaticamente capítulos finais e marca a sessão como completa.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetGameStateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Estado do jogo obtido com sucesso',
        content: {
          'application/json': {
            schema: GameStateResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Não autorizado - você não é participante desta sessão',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/game/timeline',
    tags: ['Game'],
    summary: 'Obter histórico da timeline do jogo',
    description:
      'Retorna o histórico completo de capítulos visitados, decisões tomadas e resultados de votação durante a sessão de jogo.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetTimelineSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Timeline obtida com sucesso',
        content: {
          'application/json': {
            schema: TimelineResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Não autorizado - você não é participante desta sessão',
      },
    },
  });
}
