import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ChapterSchema } from './story_schemas.js';

extendZodWithOpenApi(z);

export const ParticipantInfoSchema = z.object({
  userId: z.string().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário',
  }),
  characterId: z.string().optional().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem criado',
  }),
  characterName: z.string().optional().openapi({
    example: 'Aragorn',
    description: 'Nome do personagem',
  }),
  race: z.string().optional().openapi({
    example: 'Humano',
    description: 'Raça do personagem',
  }),
  class: z.string().optional().openapi({
    example: 'Guerreiro',
    description: 'Classe do personagem',
  }),
  hasVoted: z.boolean().openapi({
    example: false,
    description: 'Se o jogador já votou na rodada atual',
  }),
  isOnline: z.boolean().openapi({
    example: true,
    description: 'Se o jogador está online',
  }),
});

export const VoteInfoSchema = z.object({
  characterId: z.string().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem que votou',
  }),
  opcaoId: z.string().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção escolhida',
  }),
  timestamp: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Momento do voto',
  }),
});

export const GameStateSchema = z.object({
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  sessionName: z.string().openapi({
    example: 'Aventura Épica',
    description: 'Nome da sessão',
  }),
  sessionStatus: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']).openapi({
    example: 'IN_PROGRESS',
    description: 'Status da sessão',
  }),
  currentChapter: ChapterSchema.extend({
    id: z.string().openapi({
      example: 'inicio',
      description: 'ID do capítulo atual',
    }),
  }),
  participants: z.array(ParticipantInfoSchema).openapi({
    description: 'Lista de participantes da sessão',
  }),
  votos: z.array(VoteInfoSchema).openapi({
    description: 'Votos da rodada atual',
  }),
  isFinalChapter: z.boolean().openapi({
    example: false,
    description: 'Se este é o capítulo final da história',
  }),
});

export const TimelineEntrySchema = z.object({
  id: z.string().openapi({
    example: 'event_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do evento',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  chapterId: z.string().openapi({
    example: 'inicio',
    description: 'ID do capítulo visitado',
  }),
  chapterText: z.string().openapi({
    example: 'Vocês chegam à entrada de uma caverna misteriosa...',
    description: 'Texto do capítulo',
  }),
  choiceMade: z.string().optional().openapi({
    example: 'Entrar na caverna',
    description: 'Escolha que levou a este capítulo',
  }),
  votingResult: z.string().optional().openapi({
    example: 'Maioria escolheu: Entrar na caverna (3/4 votos)',
    description: 'Resultado da votação',
  }),
  timestamp: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Momento em que o capítulo foi visitado',
  }),
  type: z.enum(['STORY', 'CHOICE_RESULT', 'SYSTEM_MESSAGE']).openapi({
    example: 'STORY',
    description: 'Tipo de entrada da timeline',
  }),
});

export const GetGameStateSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const GetTimelineSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  limit: z.number().int().min(1).max(100).optional().openapi({
    example: 10,
    description: 'Número máximo de entradas (padrão: 50)',
  }),
});

export const GameStateResponseSchema = z.object({
  gameState: GameStateSchema,
  message: z.string().optional().openapi({
    example: 'Estado do jogo obtido com sucesso',
  }),
});

export const TimelineResponseSchema = z.object({
  timeline: z.array(TimelineEntrySchema).openapi({
    description: 'Histórico de capítulos visitados',
  }),
  total: z.number().int().openapi({
    example: 5,
    description: 'Total de eventos na timeline',
  }),
});

export type ParticipantInfo = z.infer<typeof ParticipantInfoSchema>;
export type VoteInfo = z.infer<typeof VoteInfoSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type GetGameState = z.infer<typeof GetGameStateSchema>;
export type GetTimeline = z.infer<typeof GetTimelineSchema>;
export type GameStateResponse = z.infer<typeof GameStateResponseSchema>;
export type TimelineResponse = z.infer<typeof TimelineResponseSchema>;
