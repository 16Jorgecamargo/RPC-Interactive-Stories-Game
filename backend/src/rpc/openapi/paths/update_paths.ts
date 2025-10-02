import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  CheckGameUpdatesSchema,
  GameUpdatesResponseSchema,
  UpdatePlayerStatusSchema,
  PlayerStatusResponseSchema,
  CheckMessagesSchema,
} from '../../../models/update_schemas.js';
import { GetMessagesResponseSchema } from '../../../models/chat_schemas.js';

export function registerUpdatePaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/updates/check',
    tags: ['Updates'],
    summary: 'Verificar atualizações do jogo (long polling)',
    description:
      'Retorna atualizações de jogo desde lastUpdateId. Use para long polling de eventos em tempo real. Tipos de eventos: PLAYER_JOINED, PLAYER_LEFT, CHARACTER_CREATED, ALL_CHARACTERS_READY, SESSION_STATE_CHANGED, VOTE_RECEIVED, CHAPTER_CHANGED, STORY_ENDED, NEW_MESSAGE, GAME_STARTED. Validações: token válido, usuário é participante da sessão. Recomendado: chamar a cada 3-5 segundos com lastUpdateId da última resposta.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CheckGameUpdatesSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Atualizações obtidas com sucesso',
        content: {
          'application/json': {
            schema: GameUpdatesResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Usuário não é participante da sessão',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/updates/heartbeat',
    tags: ['Updates'],
    summary: 'Atualizar status de conexão (heartbeat)',
    description:
      'Registra atividade do jogador e atualiza lastActivity. Deve ser chamado periodicamente (ex: a cada 30s) para manter status online. Se não receber heartbeat por >5min, o jogador é marcado como offline automaticamente. Quando um jogador offline envia heartbeat novamente, um evento PLAYER_JOINED (reconnected: true) é emitido. Validações: token válido, usuário é participante da sessão.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePlayerStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Heartbeat registrado com sucesso',
        content: {
          'application/json': {
            schema: PlayerStatusResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Usuário não é participante da sessão',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/updates/messages',
    tags: ['Updates'],
    summary: 'Verificar novas mensagens (long polling)',
    description:
      'Retorna mensagens desde lastMessageId. Use para long polling de chat em tempo real. Recomendado: chamar a cada 3-5 segundos com lastMessageId da última resposta. Validações: token válido, usuário é participante da sessão. Alternativa mais eficiente que buscar todas as mensagens repetidamente.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CheckMessagesSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Mensagens obtidas com sucesso',
        content: {
          'application/json': {
            schema: GetMessagesResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Usuário não é participante da sessão',
      },
    },
  });
}
