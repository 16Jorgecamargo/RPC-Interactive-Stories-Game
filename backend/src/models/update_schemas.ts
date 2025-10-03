import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const UpdateTypeEnum = z.enum([
  'PLAYER_JOINED',
  'PLAYER_LEFT',
  'CHARACTER_CREATED',
  'CHARACTER_UPDATED',
  'ALL_CHARACTERS_READY',
  'SESSION_STATE_CHANGED',
  'VOTE_RECEIVED',
  'CHAPTER_CHANGED',
  'STORY_ENDED',
  'NEW_MESSAGE',
  'SESSION_DELETED',
  'GAME_STARTED',
  'COMBAT_STARTED',
  'ATTACK_MADE',
  'CHARACTER_DIED',
  'CHARACTER_REVIVED',
  'REVIVE_FAILED',
  'TIMER_UPDATED',
  'VOTE_FINALIZED',
  'TIE_DETECTED',
]).openapi({
  description: 'Tipo de atualização enviada aos clientes',
});

export const GameUpdateSchema = z.object({
  id: z.string().openapi({
    example: 'update_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único da atualização',
  }),
  type: UpdateTypeEnum,
  timestamp: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Momento em que a atualização ocorreu',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  data: z.record(z.any()).openapi({
    description: 'Dados específicos da atualização',
    example: {
      userId: 'user_123',
      username: 'jogador1',
    },
  }),
});

export const CheckGameUpdatesSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  lastUpdateId: z.string().optional().openapi({
    example: 'update_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da última atualização recebida (retorna apenas atualizações posteriores)',
  }),
});

export const GameUpdatesResponseSchema = z.object({
  updates: z.array(GameUpdateSchema).openapi({
    description: 'Lista de atualizações desde lastUpdateId',
  }),
  lastUpdateId: z.string().optional().openapi({
    example: 'update_789e4567-e89b-12d3-a456-426614174000',
    description: 'ID da última atualização na lista (usar em próximo poll)',
  }),
  hasMore: z.boolean().openapi({
    example: false,
    description: 'Se existem mais atualizações disponíveis',
  }),
});

export const UpdatePlayerStatusSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const PlayerStatusResponseSchema = z.object({
  sucesso: z.boolean().openapi({
    example: true,
    description: 'Se o heartbeat foi registrado com sucesso',
  }),
  statusUpdated: z.boolean().openapi({
    example: true,
    description: 'Se o status mudou de offline para online',
  }),
  lastActivity: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Timestamp da última atividade registrada',
  }),
});

export const CheckMessagesSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  lastMessageId: z.string().optional().openapi({
    example: 'msg_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da última mensagem recebida (retorna apenas mensagens posteriores)',
  }),
});

export type UpdateType = z.infer<typeof UpdateTypeEnum>;
export type GameUpdate = z.infer<typeof GameUpdateSchema>;
export type CheckGameUpdates = z.infer<typeof CheckGameUpdatesSchema>;
export type GameUpdatesResponse = z.infer<typeof GameUpdatesResponseSchema>;
export type UpdatePlayerStatus = z.infer<typeof UpdatePlayerStatusSchema>;
export type PlayerStatusResponse = z.infer<typeof PlayerStatusResponseSchema>;
export type CheckMessages = z.infer<typeof CheckMessagesSchema>;
