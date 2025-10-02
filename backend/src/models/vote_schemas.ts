import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const TieResolutionStrategyEnum = z
  .enum(['REVOTE', 'RANDOM', 'MASTER_DECIDES'])
  .openapi({
    example: 'RANDOM',
    description: 'Estratégia para resolver empates em votações',
  });

export const VoteSchema = z.object({
  characterId: z.string().uuid().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem que está votando',
  }),
  opcaoId: z.string().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção escolhida',
  }),
});

export const SubmitVoteSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  characterId: z.string().uuid().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem votante',
  }),
  opcaoId: z.string().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção escolhida',
  }),
});

export const GetVoteStatusSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export const VoteCountSchema = z.object({
  opcaoId: z.string().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção',
  }),
  opcaoTexto: z.string().openapi({
    example: 'Entrar na caverna',
    description: 'Texto da opção',
  }),
  count: z.number().int().openapi({
    example: 3,
    description: 'Número de votos',
  }),
  percentage: z.number().openapi({
    example: 75.0,
    description: 'Porcentagem de votos',
  }),
});

export const VoteStatusSchema = z.object({
  totalParticipants: z.number().int().openapi({
    example: 4,
    description: 'Total de participantes online',
  }),
  totalVotes: z.number().int().openapi({
    example: 3,
    description: 'Total de votos recebidos',
  }),
  allVoted: z.boolean().openapi({
    example: false,
    description: 'Se todos os participantes já votaram',
  }),
  voteCounts: z.array(VoteCountSchema).openapi({
    description: 'Contagem de votos por opção',
  }),
  pendingVoters: z.array(z.string()).openapi({
    example: ['Aragorn', 'Legolas'],
    description: 'Nomes dos jogadores que ainda não votaram',
  }),
});

export const VotingResultSchema = z.object({
  winningOption: z.object({
    id: z.string().openapi({ example: 'entrar_caverna' }),
    texto: z.string().openapi({ example: 'Entrar na caverna' }),
    voteCount: z.number().int().openapi({ example: 3 }),
    percentage: z.number().openapi({ example: 75.0 }),
  }).openapi({
    description: 'Opção vencedora',
  }),
  allVotes: z.array(VoteCountSchema).openapi({
    description: 'Todos os votos por opção',
  }),
  decisionMethod: z.enum(['UNANIMOUS', 'MAJORITY', 'TIE_RESOLVED']).openapi({
    example: 'MAJORITY',
    description: 'Método de decisão utilizado',
  }),
  tieResolution: TieResolutionStrategyEnum.optional().openapi({
    example: 'RANDOM',
    description: 'Estratégia usada para resolver empate (se houver)',
  }),
  completedAt: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Momento da conclusão da votação',
  }),
});

export const SubmitVoteResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Se o voto foi registrado com sucesso',
  }),
  voteRegistered: VoteSchema,
  allVoted: z.boolean().openapi({
    example: false,
    description: 'Se todos já votaram após este voto',
  }),
  votingResult: VotingResultSchema.optional().openapi({
    description: 'Resultado da votação (se finalizada)',
  }),
  nextChapterId: z.string().optional().openapi({
    example: 'dentro_caverna',
    description: 'ID do próximo capítulo (se votação finalizada)',
  }),
  message: z.string().openapi({
    example: 'Voto registrado com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export const VoteStatusResponseSchema = z.object({
  status: VoteStatusSchema,
  hasVoted: z.boolean().openapi({
    example: true,
    description: 'Se o jogador atual já votou',
  }),
  currentVote: z.string().optional().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção que o jogador votou (se já votou)',
  }),
});

export const ResolveTieSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador (deve ser owner)',
  }),
  sessionId: z.string().uuid().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  resolution: TieResolutionStrategyEnum,
  masterChoice: z.string().optional().openapi({
    example: 'entrar_caverna',
    description: 'ID da opção escolhida pelo mestre (para MASTER_DECIDES)',
  }),
});

export const ResolveTieResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  resolution: TieResolutionStrategyEnum,
  votingResult: VotingResultSchema,
  nextChapterId: z.string().openapi({
    example: 'dentro_caverna',
    description: 'ID do próximo capítulo',
  }),
  message: z.string().openapi({
    example: 'Empate resolvido com sucesso',
    description: 'Mensagem de confirmação',
  }),
});

export type TieResolutionStrategy = z.infer<typeof TieResolutionStrategyEnum>;
export type Vote = z.infer<typeof VoteSchema>;
export type SubmitVote = z.infer<typeof SubmitVoteSchema>;
export type GetVoteStatus = z.infer<typeof GetVoteStatusSchema>;
export type VoteCount = z.infer<typeof VoteCountSchema>;
export type VoteStatus = z.infer<typeof VoteStatusSchema>;
export type VotingResult = z.infer<typeof VotingResultSchema>;
export type SubmitVoteResponse = z.infer<typeof SubmitVoteResponseSchema>;
export type VoteStatusResponse = z.infer<typeof VoteStatusResponseSchema>;
export type ResolveTie = z.infer<typeof ResolveTieSchema>;
export type ResolveTieResponse = z.infer<typeof ResolveTieResponseSchema>;
