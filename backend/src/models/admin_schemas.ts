import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const GetAllUsersSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
});

export const UserWithStatsSchema = z.object({
  id: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário',
  }),
  username: z.string().openapi({
    example: 'jogador1',
    description: 'Nome de usuário',
  }),
  isAdmin: z.boolean().openapi({
    example: false,
    description: 'Indica se o usuário é admin',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2025-01-15T10:00:00Z',
    description: 'Data de criação da conta',
  }),
  stats: z.object({
    totalSessions: z.number().int().min(0).openapi({
      example: 5,
      description: 'Total de sessões criadas',
    }),
    totalCharacters: z.number().int().min(0).openapi({
      example: 8,
      description: 'Total de personagens criados',
    }),
    activeSessions: z.number().int().min(0).openapi({
      example: 2,
      description: 'Sessões em andamento',
    }),
  }),
});

export const GetAllUsersResponseSchema = z.object({
  users: z.array(UserWithStatsSchema).openapi({
    description: 'Lista de todos os usuários com estatísticas',
  }),
  total: z.number().int().min(0).openapi({
    example: 15,
    description: 'Total de usuários no sistema',
  }),
});

export const DeleteUserSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  userId: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário a ser excluído',
  }),
});

export const DeleteUserResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a exclusão foi bem-sucedida',
  }),
  message: z.string().openapi({
    example: 'Usuário excluído com sucesso',
    description: 'Mensagem de confirmação',
  }),
  cascadeInfo: z.object({
    sessionsDeleted: z.number().int().min(0).openapi({
      example: 3,
      description: 'Número de sessões excluídas',
    }),
    charactersDeleted: z.number().int().min(0).openapi({
      example: 5,
      description: 'Número de personagens excluídos',
    }),
  }),
});

export const PromoteUserSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  userId: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário a ser promovido',
  }),
});

export const PromoteUserResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a promoção foi bem-sucedida',
  }),
  message: z.string().openapi({
    example: 'Usuário promovido a admin com sucesso',
    description: 'Mensagem de confirmação',
  }),
  user: z.object({
    id: z.string(),
    username: z.string(),
    isAdmin: z.boolean(),
  }),
});

export const DemoteUserSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  userId: z.string().uuid().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário a ter admin removido',
  }),
});

export const DemoteUserResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a remoção foi bem-sucedida',
  }),
  message: z.string().openapi({
    example: 'Privilégios de admin removidos com sucesso',
    description: 'Mensagem de confirmação',
  }),
  user: z.object({
    id: z.string(),
    username: z.string(),
    isAdmin: z.boolean(),
  }),
});

export type GetAllUsers = z.infer<typeof GetAllUsersSchema>;
export type UserWithStats = z.infer<typeof UserWithStatsSchema>;
export type GetAllUsersResponse = z.infer<typeof GetAllUsersResponseSchema>;
export const GetAllSessionsSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']).optional().openapi({
    example: 'IN_PROGRESS',
    description: 'Filtrar por status da sessão',
  }),
  ownerId: z.string().uuid().optional().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'Filtrar por ID do dono da sessão',
  }),
  storyId: z.string().uuid().optional().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
    description: 'Filtrar por ID da história',
  }),
});

export const SessionDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  storyId: z.string().uuid(),
  storyName: z.string(),
  ownerId: z.string().uuid(),
  ownerUsername: z.string(),
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
  currentChapter: z.string(),
  participantIds: z.array(z.string().uuid()),
  participantCount: z.number().int().min(0),
  maxPlayers: z.number().int().min(1).max(10),
  createdAt: z.string().datetime(),
  isLocked: z.boolean(),
});

export const GetAllSessionsResponseSchema = z.object({
  sessions: z.array(SessionDetailSchema).openapi({
    description: 'Lista de sessões com detalhes',
  }),
  total: z.number().int().min(0).openapi({
    example: 25,
    description: 'Total de sessões encontradas',
  }),
});

export const GetSessionDetailSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const GetSessionDetailResponseSchema = SessionDetailSchema.extend({
  votes: z.record(z.string()).openapi({
    description: 'Mapa de votos: characterId -> optionId',
  }),
});

export const DeleteSessionSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão a ser excluída',
  }),
});

export const DeleteSessionResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a exclusão foi bem-sucedida',
  }),
  message: z.string().openapi({
    example: 'Sessão excluída com sucesso',
    description: 'Mensagem de confirmação',
  }),
  charactersDeleted: z.number().int().min(0).openapi({
    example: 4,
    description: 'Número de personagens excluídos',
  }),
});

export const ForceSessionStateSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token (deve ser admin)',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  newStatus: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']).openapi({
    example: 'IN_PROGRESS',
    description: 'Novo status da sessão',
  }),
});

export const ForceSessionStateResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a mudança foi bem-sucedida',
  }),
  message: z.string().openapi({
    example: 'Estado da sessão alterado com sucesso',
    description: 'Mensagem de confirmação',
  }),
  session: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
  }),
});

export type DeleteUser = z.infer<typeof DeleteUserSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
export type PromoteUser = z.infer<typeof PromoteUserSchema>;
export type PromoteUserResponse = z.infer<typeof PromoteUserResponseSchema>;
export type DemoteUser = z.infer<typeof DemoteUserSchema>;
export type DemoteUserResponse = z.infer<typeof DemoteUserResponseSchema>;
export type GetAllSessions = z.infer<typeof GetAllSessionsSchema>;
export type SessionDetail = z.infer<typeof SessionDetailSchema>;
export type GetAllSessionsResponse = z.infer<typeof GetAllSessionsResponseSchema>;
export type GetSessionDetail = z.infer<typeof GetSessionDetailSchema>;
export type GetSessionDetailResponse = z.infer<typeof GetSessionDetailResponseSchema>;
export type DeleteSession = z.infer<typeof DeleteSessionSchema>;
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;
export type ForceSessionState = z.infer<typeof ForceSessionStateSchema>;
export type ForceSessionStateResponse = z.infer<typeof ForceSessionStateResponseSchema>;
