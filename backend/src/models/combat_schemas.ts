import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const EnemySchema = z.object({
  id: z.string().openapi({
    example: 'enemy_goblin_1',
    description: 'ID único do inimigo',
  }),
  name: z.string().openapi({
    example: 'Goblin Guerreiro',
    description: 'Nome do inimigo',
  }),
  hp: z.number().int().min(0).openapi({
    example: 15,
    description: 'Pontos de vida atuais',
  }),
  maxHp: z.number().int().min(1).openapi({
    example: 15,
    description: 'Pontos de vida máximos',
  }),
  ac: z.number().int().min(1).openapi({
    example: 13,
    description: 'Armor Class (CA)',
  }),
  initiative: z.number().optional().openapi({
    example: 12,
    description: 'Valor de iniciativa (D20 + modificador)',
  }),
  isDead: z.boolean().default(false).openapi({
    example: false,
    description: 'Indica se o inimigo está morto',
  }),
});

export const CombatParticipantSchema = z.object({
  characterId: z.string().uuid().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem',
  }),
  characterName: z.string().openapi({
    example: 'Thorin Escudo de Carvalho',
    description: 'Nome do personagem',
  }),
  initiative: z.number().optional().openapi({
    example: 15,
    description: 'Valor de iniciativa (D20 + modificador de Destreza)',
  }),
  hp: z.number().int().min(0).openapi({
    example: 25,
    description: 'Pontos de vida atuais',
  }),
  maxHp: z.number().int().min(1).openapi({
    example: 30,
    description: 'Pontos de vida máximos',
  }),
  isDead: z.boolean().default(false).openapi({
    example: false,
    description: 'Indica se o personagem está morto',
  }),
  reviveAttempts: z.number().int().min(0).max(3).default(0).openapi({
    example: 0,
    description: 'Número de tentativas de ressurreição usadas (máx: 3)',
  }),
});

export const CombatStateSchema = z.object({
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  chapterId: z.string().openapi({
    example: 'combate_goblins',
    description: 'ID do capítulo de combate',
  }),
  participants: z.array(CombatParticipantSchema).openapi({
    description: 'Personagens dos jogadores no combate',
  }),
  enemies: z.array(EnemySchema).openapi({
    description: 'Inimigos no combate',
  }),
  turnOrder: z.array(z.string()).openapi({
    example: ['char_123', 'enemy_goblin_1', 'char_456'],
    description: 'Ordem de turnos baseada em iniciativa',
  }),
  currentTurnIndex: z.number().int().min(0).default(0).openapi({
    example: 0,
    description: 'Índice do turno atual',
  }),
  isActive: z.boolean().default(true).openapi({
    example: true,
    description: 'Indica se o combate está ativo',
  }),
  winningSide: z.enum(['PLAYERS', 'ENEMIES', 'NONE']).optional().openapi({
    example: 'NONE',
    description: 'Lado vencedor quando combate termina',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Data de início do combate',
  }),
});

export const InitiateCombatSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const InitiateCombatResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se o combate foi iniciado com sucesso',
  }),
  combatState: CombatStateSchema,
  message: z.string().openapi({
    example: 'Combate iniciado! Todos devem rolar iniciativa.',
    description: 'Mensagem de feedback',
  }),
});

export const GetCombatStateSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const GetCombatStateResponseSchema = z.object({
  combatState: CombatStateSchema.nullable().openapi({
    description: 'Estado atual do combate, ou null se não houver combate ativo',
  }),
});

export const RollInitiativeSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  characterId: z.string().uuid().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem que está rolando iniciativa',
  }),
});

export const InitiativeRollSchema = z.object({
  characterId: z.string().uuid().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem',
  }),
  characterName: z.string().openapi({
    example: 'Thorin Escudo de Carvalho',
    description: 'Nome do personagem',
  }),
  d20Roll: z.number().int().min(1).max(20).openapi({
    example: 15,
    description: 'Resultado do D20',
  }),
  dexterityModifier: z.number().int().openapi({
    example: 2,
    description: 'Modificador de Destreza',
  }),
  total: z.number().int().openapi({
    example: 17,
    description: 'Total da iniciativa (D20 + modificador)',
  }),
});

export const RollInitiativeResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a rolagem foi bem-sucedida',
  }),
  roll: InitiativeRollSchema,
  allRolled: z.boolean().openapi({
    example: false,
    description: 'Indica se todos os participantes já rolaram iniciativa',
  }),
  turnOrder: z.array(z.string()).optional().openapi({
    example: ['char_123', 'enemy_goblin_1', 'char_456'],
    description: 'Ordem de turnos (só presente quando allRolled = true)',
  }),
});

export const GetCurrentTurnSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const CurrentTurnSchema = z.object({
  entityId: z.string().openapi({
    example: 'char_123e4567',
    description: 'ID do personagem ou inimigo no turno atual',
  }),
  entityName: z.string().openapi({
    example: 'Thorin Escudo de Carvalho',
    description: 'Nome da entidade',
  }),
  entityType: z.enum(['PLAYER', 'ENEMY']).openapi({
    example: 'PLAYER',
    description: 'Tipo da entidade',
  }),
  turnIndex: z.number().int().min(0).openapi({
    example: 0,
    description: 'Índice do turno atual',
  }),
  totalTurns: z.number().int().min(1).openapi({
    example: 5,
    description: 'Total de participantes na ordem de turnos',
  }),
});

export const GetCurrentTurnResponseSchema = z.object({
  currentTurn: CurrentTurnSchema.nullable().openapi({
    description: 'Turno atual, ou null se combate não iniciou ou já terminou',
  }),
});

export type Enemy = z.infer<typeof EnemySchema>;
export type CombatParticipant = z.infer<typeof CombatParticipantSchema>;
export type CombatState = z.infer<typeof CombatStateSchema>;
export type InitiateCombat = z.infer<typeof InitiateCombatSchema>;
export type InitiateCombatResponse = z.infer<typeof InitiateCombatResponseSchema>;
export type GetCombatState = z.infer<typeof GetCombatStateSchema>;
export type GetCombatStateResponse = z.infer<typeof GetCombatStateResponseSchema>;
export type RollInitiative = z.infer<typeof RollInitiativeSchema>;
export type InitiativeRoll = z.infer<typeof InitiativeRollSchema>;
export type RollInitiativeResponse = z.infer<typeof RollInitiativeResponseSchema>;
export type GetCurrentTurn = z.infer<typeof GetCurrentTurnSchema>;
export type CurrentTurn = z.infer<typeof CurrentTurnSchema>;
export type GetCurrentTurnResponse = z.infer<typeof GetCurrentTurnResponseSchema>;
