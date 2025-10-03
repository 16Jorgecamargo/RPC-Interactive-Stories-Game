import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const GenreEnum = z
  .enum(['Fantasia', 'Ficção Científica', 'Terror', 'Mistério', 'Aventura', 'Drama'])
  .openapi({
    example: 'Fantasia',
    description: 'Gênero da história',
  });

export const DifficultyEnum = z.enum(['Fácil', 'Médio', 'Difícil', 'Extremo']).openapi({
  example: 'Médio',
  description: 'Nível de dificuldade da história',
});

export const RecommendedPlayersSchema = z.object({
  min: z.number().int().min(1).max(10).openapi({ example: 2, description: 'Mínimo de jogadores' }),
  max: z.number().int().min(1).max(10).openapi({ example: 6, description: 'Máximo de jogadores' }),
  optimal: z
    .number()
    .int()
    .min(1)
    .max(10)
    .openapi({ example: 4, description: 'Número ideal de jogadores' }),
});

export const StoryMetadataSchema = z.object({
  genre: GenreEnum,
  synopsis: z.string().min(20).max(1000).openapi({
    example:
      'Uma jornada épica através de cavernas misteriosas repletas de perigos e tesouros antigos.',
    description: 'Sinopse da história',
  }),
  recommendedPlayers: RecommendedPlayersSchema,
  estimatedDuration: z.string().openapi({
    example: '2-3 horas',
    description: 'Duração estimada da partida',
  }),
  difficulty: DifficultyEnum,
  tags: z.array(z.string()).openapi({
    example: ['Exploração', 'Combate', 'Escolhas Morais'],
    description: 'Tags descritivas da história',
  }),
});

export const ChapterOptionSchema = z.object({
  id: z.string().openapi({ example: 'entrar_caverna', description: 'ID da opção' }),
  texto: z.string().openapi({ example: 'Entrar na caverna', description: 'Texto da opção' }),
  proximo: z.string().openapi({ example: 'dentro1', description: 'ID do próximo capítulo' }),
});

export const ChapterSchema = z.object({
  texto: z.string().openapi({
    example: 'Vocês chegam à entrada de uma caverna misteriosa...',
    description: 'Texto narrativo do capítulo',
  }),
  opcoes: z.array(ChapterOptionSchema).optional().openapi({
    description: 'Opções de escolha disponíveis (ausente em capítulos finais)',
  }),
  isCombat: z.boolean().optional().openapi({
    example: false,
    description: 'Indica se este capítulo é um nó de combate',
  }),
});

export const StorySchema = z.object({
  id: z.string().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único da história',
  }),
  title: z.string().min(3).max(100).openapi({
    example: 'A Caverna Misteriosa',
    description: 'Título da história',
  }),
  description: z.string().min(10).max(500).openapi({
    example: 'Uma aventura cheia de mistérios em uma caverna antiga.',
    description: 'Descrição curta da história',
  }),
  metadata: StoryMetadataSchema,
  mermaidSource: z.string().openapi({
    example: 'flowchart TD\n  inicio["Texto do capítulo"]...',
    description: 'Código Mermaid original da história',
  }),
  capitulos: z.record(z.string(), ChapterSchema).openapi({
    example: {
      inicio: {
        texto: 'Vocês chegam à entrada de uma caverna...',
        opcoes: [
          { id: 'entrar', texto: 'Entrar na caverna', proximo: 'dentro' },
          { id: 'voltar', texto: 'Voltar para a vila', proximo: 'vila' },
        ],
      },
    },
    description: 'Mapa de capítulos parseados do Mermaid',
  }),
  initialChapter: z.string().openapi({
    example: 'inicio',
    description: 'ID do capítulo inicial',
  }),
  isActive: z.boolean().openapi({
    example: true,
    description: 'Indica se a história está ativa e disponível no catálogo',
  }),
  createdBy: z.string().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do admin que criou a história',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2025-01-15T10:30:00Z',
    description: 'Data de criação',
  }),
});

export const CreateStorySchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
  title: z.string().min(3).max(100).openapi({ example: 'A Caverna Misteriosa' }),
  description: z.string().min(10).max(500).openapi({
    example: 'Uma aventura cheia de mistérios em uma caverna antiga.',
  }),
  metadata: StoryMetadataSchema,
  mermaidSource: z.string().openapi({
    example: 'flowchart TD\n  inicio["Texto inicial"]-->decisao{Escolha?}',
    description: 'Código Mermaid da história',
  }),
});

export const UploadMermaidSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
  title: z.string().min(3).max(100).openapi({ example: 'A Caverna Misteriosa' }),
  description: z.string().min(10).max(500).openapi({
    example: 'Uma aventura cheia de mistérios em uma caverna antiga.',
  }),
  metadata: StoryMetadataSchema,
  mermaidContent: z.string().openapi({
    example: 'flowchart TD\n  inicio["Texto inicial"]-->decisao{Escolha?}',
    description: 'Conteúdo do arquivo .mmd',
  }),
});

export const GetStoriesSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
});

export const GetStoryCatalogSchema = z.object({
  token: z.string().optional().openapi({ example: 'eyJhbGc...', description: 'JWT token (opcional)' }),
});

export const GetStorySchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  storyId: z.string().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const UpdateStorySchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
  storyId: z.string().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
  }),
  title: z.string().min(3).max(100).optional().openapi({ example: 'Novo Título' }),
  description: z.string().min(10).max(500).optional().openapi({ example: 'Nova descrição' }),
  metadata: StoryMetadataSchema.optional(),
  mermaidSource: z.string().optional().openapi({
    description: 'Novo código Mermaid (reparseia automaticamente)',
  }),
});

export const DeleteStorySchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
  storyId: z.string().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
  }),
});

export const ToggleStoryStatusSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token do admin' }),
  storyId: z.string().openapi({
    example: 'story_123e4567-e89b-12d3-a456-426614174000',
  }),
  isActive: z.boolean().openapi({
    example: true,
    description: 'Novo status da história',
  }),
});

export const PublicStoryInfoSchema = StorySchema.pick({
  id: true,
  title: true,
  description: true,
  metadata: true,
  initialChapter: true,
  createdAt: true,
}).extend({
  totalChapters: z.number().int().openapi({
    example: 15,
    description: 'Número total de capítulos',
  }),
});

export const StoriesListSchema = z.object({
  stories: z.array(StorySchema),
  total: z.number().int().openapi({ example: 5, description: 'Total de histórias' }),
});

export const PublicCatalogSchema = z.object({
  stories: z.array(PublicStoryInfoSchema),
  total: z.number().int().openapi({ example: 3, description: 'Total de histórias ativas' }),
});

export const DeleteStoryResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'História excluída com sucesso' }),
});

export const ToggleStoryStatusResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Status da história atualizado' }),
  newStatus: z.boolean().openapi({ example: false }),
});

export type Genre = z.infer<typeof GenreEnum>;
export type Difficulty = z.infer<typeof DifficultyEnum>;
export type RecommendedPlayers = z.infer<typeof RecommendedPlayersSchema>;
export type StoryMetadata = z.infer<typeof StoryMetadataSchema>;
export type ChapterOption = z.infer<typeof ChapterOptionSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Story = z.infer<typeof StorySchema>;
export type CreateStory = z.infer<typeof CreateStorySchema>;
export type UploadMermaid = z.infer<typeof UploadMermaidSchema>;
export type GetStories = z.infer<typeof GetStoriesSchema>;
export type GetStoryCatalog = z.infer<typeof GetStoryCatalogSchema>;
export type GetStory = z.infer<typeof GetStorySchema>;
export type UpdateStory = z.infer<typeof UpdateStorySchema>;
export type DeleteStory = z.infer<typeof DeleteStorySchema>;
export type ToggleStoryStatus = z.infer<typeof ToggleStoryStatusSchema>;
export type PublicStoryInfo = z.infer<typeof PublicStoryInfoSchema>;
export type StoriesList = z.infer<typeof StoriesListSchema>;
export type PublicCatalog = z.infer<typeof PublicCatalogSchema>;
export type DeleteStoryResponse = z.infer<typeof DeleteStoryResponseSchema>;
export type ToggleStoryStatusResponse = z.infer<typeof ToggleStoryStatusResponseSchema>;
