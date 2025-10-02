import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SessionStatusEnum = z
  .enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED'])
  .openapi({
    example: 'WAITING_PLAYERS',
    description: 'Status atual da sessão de jogo',
  });

export const ParticipantSchema = z.object({
  userId: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário participante',
  }),
  characterId: z.string().uuid().optional().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem criado (opcional até criação)',
  }),
  hasCreatedCharacter: z.boolean().openapi({
    example: false,
    description: 'Indica se o participante já criou seu personagem',
  }),
  isOnline: z.boolean().openapi({
    example: true,
    description: 'Indica se o participante está online',
  }),
  joinedAt: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Data de entrada na sessão',
  }),
  lastActivity: z.string().datetime().optional().openapi({
    example: '2025-01-15T10:35:00Z',
    description: 'Última atividade do participante',
  }),
});

export const SessionSchema = z.object({
  id: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único da sessão',
  }),
  name: z.string().min(3).max(100).openapi({
    example: 'Aventura na Caverna',
    description: 'Nome da sessão',
  }),
  sessionCode: z.string().length(6).openapi({
    example: 'ABC123',
    description: 'Código de 6 caracteres para entrada',
  }),
  storyId: z.string().uuid().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da história sendo jogada',
  }),
  ownerId: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do criador/mestre da sessão',
  }),
  status: SessionStatusEnum,
  participants: z.array(ParticipantSchema).openapi({
    description: 'Lista de participantes da sessão',
  }),
  maxPlayers: z.number().int().min(2).max(10).openapi({
    example: 4,
    description: 'Número máximo de jogadores permitidos',
  }),
  isLocked: z.boolean().openapi({
    example: false,
    description: 'Se true, novos jogadores não podem entrar',
  }),
  currentChapter: z.string().openapi({
    example: 'inicio',
    description: 'ID do capítulo atual da história',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2025-01-15T10:00:00Z',
    description: 'Data de criação',
  }),
  updatedAt: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Data da última atualização',
  }),
  startedAt: z.string().datetime().optional().openapi({
    example: '2025-01-15T10:45:00Z',
    description: 'Data de início do jogo (quando status mudou para IN_PROGRESS)',
  }),
  completedAt: z.string().datetime().optional().openapi({
    example: '2025-01-15T12:30:00Z',
    description: 'Data de conclusão do jogo',
  }),
  votes: z.record(z.string(), z.string()).optional().openapi({
    example: { 'char_123': 'opcao1', 'char_456': 'opcao2' },
    description: 'Mapa de votos: characterId -> opcaoId',
  }),
});

export const CreateSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  name: z.string().min(3).max(100).openapi({
    example: 'Aventura na Caverna',
    description: 'Nome da sessão',
  }),
  storyId: z.string().uuid().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da história a ser jogada',
  }),
  maxPlayers: z.number().int().min(2).max(10).default(4).openapi({
    example: 4,
    description: 'Número máximo de jogadores (padrão: 4)',
  }),
});

export const JoinSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionCode: z.string().length(6).openapi({
    example: 'ABC123',
    description: 'Código de 6 caracteres da sessão',
  }),
});

export const GetSessionsSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
});

export const GetSessionDetailsSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const DeleteSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão a ser excluída',
  }),
});

export const LeaveSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão para sair',
  }),
});

export const SessionWithStorySchema = SessionSchema.extend({
  storyTitle: z.string().openapi({
    example: 'A Caverna Misteriosa',
    description: 'Título da história',
  }),
  storyGenre: z.string().openapi({
    example: 'Fantasia',
    description: 'Gênero da história',
  }),
});

export const CreateSessionResponseSchema = z.object({
  session: SessionSchema,
  message: z.string().openapi({
    example: 'Sessão criada com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export const JoinSessionResponseSchema = z.object({
  session: SessionSchema,
  message: z.string().openapi({
    example: 'Você entrou na sessão com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export const SessionsListSchema = z.object({
  sessions: z.array(SessionWithStorySchema),
  total: z.number().int().openapi({
    example: 3,
    description: 'Total de sessões',
  }),
});

export const SessionDetailsResponseSchema = z.object({
  session: SessionSchema,
  story: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    genre: z.string(),
    difficulty: z.string(),
    estimatedDuration: z.string(),
  }),
});

export const DeleteSessionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({
    example: 'Sessão excluída com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export const LeaveSessionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({
    example: 'Você saiu da sessão',
    description: 'Mensagem de confirmação',
  }),
});

export const TransitionToCreatingCharactersSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const CanStartSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const StartSessionSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão a ser iniciada',
  }),
});

export const TransitionResponseSchema = z.object({
  session: SessionSchema,
  message: z.string().openapi({
    example: 'Estado da sessão atualizado com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export const CanStartResponseSchema = z.object({
  canStart: z.boolean().openapi({
    example: true,
    description: 'Indica se a sessão pode ser iniciada',
  }),
  missingRequirements: z.array(z.string()).openapi({
    example: [],
    description: 'Lista de requisitos faltantes',
  }),
  participantsReady: z.number().int().openapi({
    example: 3,
    description: 'Número de participantes que criaram personagens',
  }),
  totalParticipants: z.number().int().openapi({
    example: 3,
    description: 'Total de participantes na sessão',
  }),
});

export const StartSessionResponseSchema = z.object({
  session: SessionSchema,
  message: z.string().openapi({
    example: 'Sessão iniciada com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export type SessionStatus = z.infer<typeof SessionStatusEnum>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type JoinSession = z.infer<typeof JoinSessionSchema>;
export type GetSessions = z.infer<typeof GetSessionsSchema>;
export type GetSessionDetails = z.infer<typeof GetSessionDetailsSchema>;
export type DeleteSession = z.infer<typeof DeleteSessionSchema>;
export type LeaveSession = z.infer<typeof LeaveSessionSchema>;
export type SessionWithStory = z.infer<typeof SessionWithStorySchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type JoinSessionResponse = z.infer<typeof JoinSessionResponseSchema>;
export type SessionsList = z.infer<typeof SessionsListSchema>;
export type SessionDetailsResponse = z.infer<typeof SessionDetailsResponseSchema>;
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;
export type LeaveSessionResponse = z.infer<typeof LeaveSessionResponseSchema>;
export type TransitionToCreatingCharacters = z.infer<typeof TransitionToCreatingCharactersSchema>;
export type CanStartSession = z.infer<typeof CanStartSessionSchema>;
export type StartSession = z.infer<typeof StartSessionSchema>;
export type TransitionResponse = z.infer<typeof TransitionResponseSchema>;
export type CanStartResponse = z.infer<typeof CanStartResponseSchema>;
export type StartSessionResponse = z.infer<typeof StartSessionResponseSchema>;
