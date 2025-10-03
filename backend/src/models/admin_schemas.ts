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
export type DeleteUser = z.infer<typeof DeleteUserSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
export type PromoteUser = z.infer<typeof PromoteUserSchema>;
export type PromoteUserResponse = z.infer<typeof PromoteUserResponseSchema>;
export type DemoteUser = z.infer<typeof DemoteUserSchema>;
export type DemoteUserResponse = z.infer<typeof DemoteUserResponseSchema>;
