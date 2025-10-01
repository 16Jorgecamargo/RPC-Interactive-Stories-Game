# 8. Validação com Zod

## 8.1 Abordagem de Validação e Documentação

Este projeto utiliza **Zod** como fonte única de validação e documentação:

### Fluxo de Integração

```
Schema Zod (.describe())
    ↓
fastify-type-provider-zod (setValidatorCompiler)
    ↓
Validação automática de request/response
    ↓
@fastify/swagger (serializerCompiler)
    ↓
OpenAPI 3.0 gerado automaticamente
    ↓
Swagger UI em /docs
```

### Princípios

1. **Schemas definem tudo**: Validação, tipos TypeScript, e documentação OpenAPI
2. **`.describe()` vira docs**: Toda string em `.describe()` aparece na documentação
3. **Validação automática**: Fastify valida entrada/saída antes de executar handlers
4. **Type-safety**: TypeScript infere tipos dos schemas automaticamente
5. **Erro 400 automático**: Payloads inválidos retornam erro antes de chegar no handler

### Exemplo Completo

```typescript
import { z } from "zod";
import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

// Schema de entrada
export const CreateCharacterSchema = z.object({
  name: z.string()
    .min(2, "Nome muito curto")
    .max(30, "Nome muito longo")
    .describe("Nome do personagem D&D"),
  race: z.enum(["Humano", "Elfo", "Anão", "Halfling"])
    .describe("Raça do personagem"),
  class: z.enum(["Guerreiro", "Mago", "Ladino", "Clérigo"])
    .describe("Classe do personagem"),
  attributes: z.object({
    strength: z.number().min(3).max(18).describe("Força"),
    dexterity: z.number().min(3).max(18).describe("Destreza"),
    constitution: z.number().min(3).max(18).describe("Constituição"),
    intelligence: z.number().min(3).max(18).describe("Inteligência"),
    wisdom: z.number().min(3).max(18).describe("Sabedoria"),
    charisma: z.number().min(3).max(18).describe("Carisma")
  }).describe("Atributos D&D (rolagem 4d6 drop lowest)"),
  background: z.string().min(10).describe("História de background do personagem")
});

// Schema de resposta
export const CharacterResponseSchema = z.object({
  success: z.boolean(),
  character: z.object({
    id: z.string().uuid(),
    name: z.string(),
    race: z.string(),
    class: z.string(),
    attributes: z.object({
      strength: z.number(),
      dexterity: z.number(),
      constitution: z.number(),
      intelligence: z.number(),
      wisdom: z.number(),
      charisma: z.number()
    }),
    background: z.string(),
    createdAt: z.string().datetime()
  })
});

// Rota com validação automática
const characterRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/rpc/characters",
    schema: {
      tags: ["Characters"],
      summary: "Cria novo personagem D&D",
      description: "Valida atributos, gera ID, persiste no banco",
      body: CreateCharacterSchema,
      response: {
        200: CharacterResponseSchema,
        400: ErrorSchema // Retorno automático se validação falhar
      }
    },
    handler: async (request, reply) => {
      // request.body já está validado e tipado!
      const { name, race, class: className, attributes, background } = request.body;

      // Lógica de negócio...
      const character = await characterService.create({
        name,
        race,
        class: className,
        attributes,
        background
      });

      return { success: true, character };
    }
  });
};
```

**Resultado**: A rota acima automaticamente:
- ✅ Valida `request.body` contra `CreateCharacterSchema`
- ✅ Retorna erro 400 se dados inválidos
- ✅ Gera documentação OpenAPI em `/docs`
- ✅ Infere tipos TypeScript (`request.body` é tipado)
- ✅ Valida `response` contra `CharacterResponseSchema`

## 8.2 Schemas de Validação do Projeto

Todos os schemas abaixo estão em `src/models/schemas.ts` e são usados diretamente nas rotas Fastify.

```javascript
// Schema para usuário
const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  passwordHash: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date(),
  lastLogin: z.date().optional()
});

// Schema para cadastro
const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(50),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

// Schema para login
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

// Schema para personagem D&D
const DnDCharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(30),
  race: z.string().min(1).max(20),
  class: z.string().min(1).max(20),
  background: z.string().min(10).max(1000),
  appearance: z.string().min(10).max(500),
  personality: z.string().min(5).max(300),
  fears: z.string().min(5).max(200),
  goals: z.string().min(5).max(300),
  attributes: z.object({
    strength: z.number().min(3).max(18),
    dexterity: z.number().min(3).max(18),
    constitution: z.number().min(3).max(18),
    intelligence: z.number().min(3).max(18),
    wisdom: z.number().min(3).max(18),
    charisma: z.number().min(3).max(18)
  }),
  equipment: z.array(z.string()).max(10),
  userId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  isComplete: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema para criação de personagem D&D
const CreateDnDCharacterSchema = z.object({
  name: z.string().min(2).max(30),
  race: z.string().min(1).max(20),
  class: z.string().min(1).max(20),
  background: z.string().min(10).max(1000),
  appearance: z.string().min(10).max(500),
  personality: z.string().min(5).max(300),
  fears: z.string().min(5).max(200),
  goals: z.string().min(5).max(300),
  attributes: z.object({
    strength: z.number().min(3).max(18),
    dexterity: z.number().min(3).max(18),
    constitution: z.number().min(3).max(18),
    intelligence: z.number().min(3).max(18),
    wisdom: z.number().min(3).max(18),
    charisma: z.number().min(3).max(18)
  }),
  equipment: z.array(z.string()).max(10)
});

// Schema para raça de personagem
const RaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  traits: z.array(z.string())
});

// Schema para classe de personagem
const ClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  primaryAttribute: z.string()
});

// Schema para história
const StorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  createdBy: z.string().uuid(),
  mermaidSource: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  capitulos: z.record(z.object({
    texto: z.string(),
    opcoes: z.array(z.object({
      id: z.string(),
      texto: z.string(),
      proximo: z.string()
    })).optional()
  }))
});

// Schema para import Mermaid
const MermaidImportSchema = z.object({
  mermaidCode: z.string().min(10),
  title: z.string().min(1).max(100),
  description: z.string().max(1000)
});

// Schema para sessão
const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  storyId: z.string().uuid(),
  ownerId: z.string().uuid(),
  currentChapter: z.string(),
  participants: z.array(z.string().uuid()),
  votes: z.record(z.string()),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema para criação de sessão
const CreateSessionSchema = z.object({
  name: z.string().min(1).max(50),
  storyId: z.string().uuid()
});

// Schema para voto
const VoteSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  characterId: z.string().uuid(),
  opcaoId: z.string(),
  timestamp: z.date()
});

// Schema para mensagem de chat
const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  characterId: z.string().uuid(),
  characterName: z.string(),
  mensagem: z.string().min(1).max(500),
  timestamp: z.date()
});

// Schema para envio de mensagem
const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  characterId: z.string().uuid(),
  mensagem: z.string().min(1).max(500)
});

// Schema para atualização
const UpdateSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['CHARACTER_JOINED', 'CHARACTER_LEFT', 'VOTE_RECEIVED', 'CHAPTER_CHANGED', 'STORY_ENDED', 'NEW_MESSAGE', 'SESSION_DELETED']),
  timestamp: z.date(),
  sessionId: z.string().uuid(),
  data: z.any()
});

// Schema para JWT Token Payload
const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  iat: z.number(),
  exp: z.number()
});

// Schema para middleware de autenticação
const AuthHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer .+$/)
});

// Schema para dashboard
const DashboardSchema = z.object({
  hasSessions: z.boolean(),
  sessionCards: z.array(z.object({
    sessionId: z.string().uuid(),
    name: z.string(),
    storyTitle: z.string(),
    storyGenre: z.string(),
    status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
    statusDisplay: z.string(),
    playerCount: z.object({
      current: z.number().min(0),
      max: z.number().min(1)
    }),
    progress: z.object({
      currentChapter: z.string(),
      chapterTitle: z.string()
    }).optional(),
    lastActivity: z.date(),
    timeAgo: z.string(),
    canJoin: z.boolean(),
    sessionCode: z.string().optional()
  })).optional(),
  actions: z.array(z.string()),
  showWelcome: z.boolean().optional()
});

// Schema para catálogo de histórias
const StoryCatalogSchema = z.object({
  stories: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    genre: z.string(),
    synopsis: z.string(),
    recommendedPlayers: z.object({
      min: z.number().min(1),
      max: z.number().min(1),
      optimal: z.number().min(1)
    }),
    estimatedDuration: z.string(),
    difficulty: z.string(),
    tags: z.array(z.string()),
    isActive: z.boolean()
  }))
});

// Schema para estado da sala de espera
const WaitingRoomStateSchema = z.object({
  sessionId: z.string().uuid(),
  sessionCode: z.string(),
  sessionName: z.string(),
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
  canStart: z.boolean(),
  waitingFor: z.array(z.string()).optional(),
  participants: z.array(z.object({
    userId: z.string().uuid(),
    username: z.string(),
    characterName: z.string().optional(),
    characterMiniDescription: z.string().optional(),
    hasCreatedCharacter: z.boolean(),
    isReady: z.boolean()
  })),
  story: z.object({
    title: z.string(),
    genre: z.string(),
    estimatedDuration: z.string()
  })
});

// Schema para sumário de personagem
const CharacterSummarySchema = z.object({
  characterId: z.string().uuid(),
  name: z.string(),
  race: z.string(),
  class: z.string(),
  miniDescription: z.string(),
  userId: z.string().uuid(),
  username: z.string()
});

// Schema para informações de participante
const ParticipantInfoSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  characterId: z.string().uuid().optional(),
  hasCreatedCharacter: z.boolean(),
  isOnline: z.boolean(),
  joinedAt: z.date()
});

// Schema para informações de história pública
const PublicStoryInfoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  genre: z.string(),
  synopsis: z.string(),
  difficulty: z.string(),
  estimatedDuration: z.string(),
  recommendedPlayers: z.object({
    min: z.number(),
    max: z.number(),
    optimal: z.number()
  }),
  tags: z.array(z.string())
});

// Schema para informações de sessão pública
const PublicSessionInfoSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string(),
  storyTitle: z.string(),
  currentPlayers: z.number(),
  maxPlayers: z.number(),
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS']),
  sessionCode: z.string()
});

// Schema para estado do jogo
const GameStateSchema = z.object({
  capitulo: z.object({
    id: z.string(),
    texto: z.string(),
    opcoes: z.array(z.object({
      id: z.string(),
      texto: z.string(),
      proximo: z.string()
    })).optional()
  }),
  participants: z.array(CharacterSummarySchema),
  votos: z.array(z.object({
    characterId: z.string().uuid(),
    opcaoId: z.string().optional(),
    characterName: z.string()
  }))
});

// Schema para estatísticas do sistema
const SystemStatsSchema = z.object({
  totalUsers: z.number().min(0),
  totalSessions: z.number().min(0),
  totalStories: z.number().min(0),
  activeUsers: z.number().min(0),
  activeSessions: z.number().min(0)
});

// Schema para estatísticas de uso de história
const StoryUsageStatsSchema = z.object({
  storyId: z.string().uuid(),
  totalSessions: z.number().min(0),
  completedSessions: z.number().min(0),
  averageSessionDuration: z.number().min(0),
  totalPlayers: z.number().min(0),
  popularChoices: z.array(z.object({
    chapterId: z.string(),
    opcaoId: z.string(),
    count: z.number().min(0),
    percentage: z.number().min(0).max(100)
  }))
});

// Schema para entrada em sessão via código
const JoinByCodeSchema = z.object({
  sessionCode: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/)
});

// Schema para validação de requisitos de início
const StartRequirementsSchema = z.object({
  canStart: z.boolean(),
  missingRequirements: z.array(z.string()),
  participantsReady: z.boolean(),
  minPlayersReached: z.boolean(),
  allCharactersCreated: z.boolean()
});

// Schema para resposta de validação
const ValidationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional()
});

// Schema para metadados de história
const StoryMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  genre: z.string().min(1).max(50),
  synopsis: z.string().min(10).max(500),
  difficulty: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
  estimatedDuration: z.string(),
  recommendedPlayers: z.object({
    min: z.number().min(1).max(10),
    max: z.number().min(1).max(10),
    optimal: z.number().min(1).max(10)
  }),
  tags: z.array(z.string()).max(10)
});

// Schema para usuário com estatísticas (painel admin)
const UserWithStatsSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
  statistics: z.object({
    totalSessions: z.number().min(0),
    activeSessions: z.number().min(0),
    completedSessions: z.number().min(0),
    totalCharacters: z.number().min(0)
  })
});

// Schema para sessão com detalhes (visualização admin)
const SessionWithDetailsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sessionCode: z.string(),
  storyId: z.string().uuid(),
  storyTitle: z.string(),
  ownerId: z.string().uuid(),
  ownerUsername: z.string(),
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
  participantCount: z.number().min(0),
  maxPlayers: z.number().min(1),
  currentChapter: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActivity: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
});

// Schema para detalhes completos de sessão (dialog admin)
const FullSessionDetailsSchema = z.object({
  session: SessionWithDetailsSchema,
  story: z.object({
    title: z.string(),
    genre: z.string(),
    description: z.string(),
    estimatedDuration: z.string()
  }),
  participants: z.array(z.object({
    userId: z.string().uuid(),
    username: z.string(),
    characterName: z.string(),
    hasCreatedCharacter: z.boolean(),
    joinedAt: z.date(),
    isOnline: z.boolean()
  })),
  progress: z.object({
    currentChapter: z.string(),
    chapterTitle: z.string(),
    totalVotes: z.number().min(0),
    pendingVotes: z.number().min(0),
    chaptersCompleted: z.number().min(0)
  }),
  timestamps: z.object({
    created: z.date(),
    started: z.date().optional(),
    lastActivity: z.date(),
    completed: z.date().optional()
  })
});

// Schema para confirmação de exclusão
const DeleteConfirmationSchema = z.object({
  confirmed: z.boolean(),
  targetId: z.string().uuid(),
  targetType: z.enum(['USER', 'SESSION'])
});

// Schema para resposta de confirmação de exclusão de usuário
const UserDeleteConfirmationSchema = z.object({
  message: z.string(),
  cascadeInfo: z.object({
    sessionsToDelete: z.number().min(0),
    charactersToDelete: z.number().min(0)
  })
});

// Schema para resposta de confirmação de exclusão de sessão
const SessionDeleteConfirmationSchema = z.object({
  message: z.string(),
  sessionInfo: z.object({
    name: z.string(),
    participantCount: z.number().min(0),
    status: z.string()
  })
});

// Schema para dashboard administrativo
const AdminDashboardSchema = z.object({
  hasSessions: z.boolean(),
  sessionCards: z.array(z.object({
    sessionId: z.string().uuid(),
    name: z.string(),
    storyTitle: z.string(),
    storyGenre: z.string(),
    status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']),
    statusDisplay: z.string(),
    playerCount: z.object({
      current: z.number().min(0),
      max: z.number().min(1)
    }),
    progress: z.object({
      currentChapter: z.string(),
      chapterTitle: z.string()
    }).optional(),
    lastActivity: z.date(),
    timeAgo: z.string(),
    canJoin: z.boolean(),
    sessionCode: z.string().optional()
  })).optional(),
  actions: z.array(z.string()),
  showWelcome: z.boolean().optional(),
  hasManagementAccess: z.boolean()
});

// Schema para estatísticas detalhadas do sistema
const DetailedSystemStatsSchema = z.object({
  users: z.object({
    total: z.number().min(0),
    admins: z.number().min(0),
    activeToday: z.number().min(0),
    newThisWeek: z.number().min(0)
  }),
  sessions: z.object({
    total: z.number().min(0),
    active: z.number().min(0),
    completed: z.number().min(0),
    averageDuration: z.number().min(0),
    mostPopularStory: z.string()
  }),
  stories: z.object({
    total: z.number().min(0),
    active: z.number().min(0),
    mostUsed: z.object({
      title: z.string(),
      usageCount: z.number().min(0)
    })
  }),
  system: z.object({
    uptime: z.number().min(0),
    totalGameHours: z.number().min(0),
    averagePlayersPerSession: z.number().min(0)
  })
});

// Schema para filtros de sessão (admin)
const SessionFiltersSchema = z.object({
  status: z.enum(['WAITING_PLAYERS', 'CREATING_CHARACTERS', 'IN_PROGRESS', 'COMPLETED']).optional(),
  ownerId: z.string().uuid().optional(),
  storyId: z.string().uuid().optional(),
  minParticipants: z.number().min(0).optional(),
  maxParticipants: z.number().min(1).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional()
});

// Schema para estado da tela de jogo
const GameScreenStateSchema = z.object({
  sessionId: z.string().uuid(),
  sessionName: z.string(),
  currentChapter: z.object({
    id: z.string(),
    texto: z.string(),
    opcoes: z.array(z.object({
      id: z.string(),
      texto: z.string(),
      proximo: z.string()
    })).optional()
  }),
  votingState: z.object({
    isActive: z.boolean(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
      voteCount: z.number().min(0),
      percentage: z.number().min(0).max(100),
      isWinning: z.boolean()
    })),
    votes: z.array(z.object({
      characterId: z.string().uuid(),
      characterName: z.string(),
      optionId: z.string(),
      timestamp: z.date()
    })),
    timer: z.object({
      isActive: z.boolean(),
      timeRemaining: z.number().min(0),
      totalTime: z.number().min(0),
      startedAt: z.date(),
      endsAt: z.date(),
      autoFinishEnabled: z.boolean()
    }),
    canVote: z.boolean(),
    hasVoted: z.boolean(),
    currentPlayerVote: z.string().optional()
  }),
  playerCount: z.number().min(1),
  gameProgress: z.object({
    currentChapterIndex: z.number().min(0),
    totalChapters: z.number().min(1),
    completionPercentage: z.number().min(0).max(100)
  })
});

// Schema para timeline da narrativa
const TimelineDataSchema = z.object({
  currentEntry: z.object({
    id: z.string(),
    chapterTitle: z.string(),
    text: z.string(),
    timestamp: z.date(),
    type: z.enum(['STORY', 'CHOICE_RESULT', 'SYSTEM_MESSAGE']),
    metadata: z.object({
      choicesMade: z.string(),
      votingResult: z.string()
    }).optional()
  }),
  previousEntries: z.array(z.object({
    id: z.string(),
    chapterTitle: z.string(),
    text: z.string(),
    timestamp: z.date(),
    type: z.enum(['STORY', 'CHOICE_RESULT', 'SYSTEM_MESSAGE'])
  })),
  hasNextChapter: z.boolean()
});

// Schema para tile de jogador
const PlayerTileSchema = z.object({
  userId: z.string().uuid(),
  characterId: z.string().uuid(),
  characterName: z.string().min(2).max(30),
  miniDescription: z.string().min(5).max(100),
  race: z.string(),
  class: z.string(),
  isOnline: z.boolean(),
  lastActivity: z.date(),
  hasVoted: z.boolean(),
  currentVote: z.string().optional(),
  profileImage: z.string().url().optional()
});

// Schema para ficha completa de personagem
const FullCharacterSheetSchema = z.object({
  basic: z.object({
    name: z.string().min(2).max(30),
    race: z.string(),
    class: z.string(),
    level: z.number().min(1).max(20)
  }),
  attributes: z.object({
    strength: z.number().min(3).max(18),
    dexterity: z.number().min(3).max(18),
    constitution: z.number().min(3).max(18),
    intelligence: z.number().min(3).max(18),
    wisdom: z.number().min(3).max(18),
    charisma: z.number().min(3).max(18)
  }),
  background: z.object({
    story: z.string().min(10).max(1000),
    appearance: z.string().min(10).max(500),
    personality: z.string().min(5).max(300),
    fears: z.string().min(5).max(200),
    goals: z.string().min(5).max(300)
  }),
  equipment: z.array(z.string()).max(10),
  gameStats: z.object({
    totalVotes: z.number().min(0),
    decisionsInfluenced: z.number().min(0),
    sessionJoinDate: z.date()
  })
});

// Schema para timer de votação
const VotingTimerSchema = z.object({
  isActive: z.boolean(),
  timeRemaining: z.number().min(0),
  totalTime: z.number().min(0),
  startedAt: z.date(),
  endsAt: z.date(),
  autoFinishEnabled: z.boolean()
});

// Schema para resultado de votação
const VotingResultSchema = z.object({
  winningOption: z.object({
    id: z.string(),
    text: z.string(),
    voteCount: z.number().min(0),
    percentage: z.number().min(0).max(100)
  }),
  allVotes: z.array(z.object({
    optionId: z.string(),
    count: z.number().min(0),
    percentage: z.number().min(0).max(100)
  })),
  participantCount: z.number().min(1),
  decisionMethod: z.enum(['UNANIMOUS', 'MAJORITY', 'TIMEOUT']),
  completedAt: z.date()
});

// Schema para estado do chat na tela de jogo
const GameChatStateSchema = z.object({
  messages: z.array(z.object({
    id: z.string().uuid(),
    characterId: z.string().uuid(),
    characterName: z.string(),
    message: z.string().min(1).max(500),
    timestamp: z.date(),
    type: z.enum(['PLAYER', 'SYSTEM', 'VOTING_UPDATE'])
  })),
  playerCount: z.number().min(1),
  isActive: z.boolean(),
  lastMessageId: z.string().uuid()
});

// Schema para atualizações da tela de jogo
const GameUpdateSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['VOTE_RECEIVED', 'TIMER_STARTED', 'TIMER_UPDATE', 'VOTING_COMPLETED', 'CHAPTER_CHANGED', 'PLAYER_STATUS_CHANGED', 'CHAT_MESSAGE']),
  timestamp: z.date(),
  sessionId: z.string().uuid(),
  data: z.object({
    // Para VOTE_RECEIVED
    characterName: z.string().optional(),
    optionChosen: z.string().optional(),
    votesRemaining: z.number().min(0).optional(),

    // Para TIMER_UPDATE
    timeRemaining: z.number().min(0).optional(),

    // Para VOTING_COMPLETED
    result: VotingResultSchema.optional(),

    // Para CHAPTER_CHANGED
    newChapter: z.object({
      id: z.string(),
      texto: z.string(),
      opcoes: z.array(z.object({
        id: z.string(),
        texto: z.string(),
        proximo: z.string()
      })).optional()
    }).optional(),

    // Para PLAYER_STATUS_CHANGED
    playerUpdates: z.array(z.object({
      characterId: z.string().uuid(),
      characterName: z.string(),
      isOnline: z.boolean(),
      lastActivity: z.date()
    })).optional(),

    // Para CHAT_MESSAGE
    message: z.object({
      id: z.string().uuid(),
      characterId: z.string().uuid(),
      characterName: z.string(),
      message: z.string(),
      timestamp: z.date(),
      type: z.enum(['PLAYER', 'SYSTEM', 'VOTING_UPDATE'])
    }).optional()
  })
});

// Schema para requisição de voto
const VoteRequestSchema = z.object({
  sessionId: z.string().uuid(),
  characterId: z.string().uuid(),
  opcaoId: z.string().min(1)
});

// Schema para heartbeat de status do jogador
const PlayerStatusUpdateSchema = z.object({
  sessionId: z.string().uuid(),
  timestamp: z.date(),
  action: z.enum(['HEARTBEAT', 'VOTE', 'CHAT_MESSAGE', 'VIEW_CHARACTER'])
});

// Schema para estado de combate
const CombatStateSchema = z.object({
  sessionId: z.string().uuid(),
  combatId: z.string().uuid(),
  phase: z.enum(['INITIATIVE', 'COMBAT_TURNS', 'COMPLETED']),
  currentRound: z.number().min(1),
  currentTurn: z.number().min(0),
  initiativeOrder: z.array(z.object({
    combatantId: z.string().uuid(),
    combatantName: z.string(),
    combatantType: z.enum(['PLAYER', 'ENEMY']),
    initiativeRoll: z.number().min(1).max(20),
    modifiers: z.number(),
    totalInitiative: z.number(),
    position: z.number().min(1)
  })),
  isActive: z.boolean(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  victoryCondition: z.enum(['ALL_ENEMIES_DEAD', 'ALL_PLAYERS_DEAD', 'SPECIAL'])
});

// Schema para participante de combate
const CombatParticipantSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid(),
  characterName: z.string().min(2).max(30),
  type: z.enum(['PLAYER', 'ENEMY']),
  state: z.enum(['ALIVE', 'DEAD', 'PERMANENTLY_DEAD']),
  currentHP: z.number().min(0),
  maxHP: z.number().min(1),
  armorClass: z.number().min(1).max(30),
  attributes: z.object({
    strength: z.number().min(3).max(18),
    dexterity: z.number().min(3).max(18),
    constitution: z.number().min(3).max(18),
    intelligence: z.number().min(3).max(18),
    wisdom: z.number().min(3).max(18),
    charisma: z.number().min(3).max(18),
    attackBonus: z.number(),
    damageBonus: z.number(),
    initiativeBonus: z.number()
  }),
  equipment: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['WEAPON', 'ARMOR', 'SHIELD', 'ACCESSORY']),
    attackBonus: z.number().optional(),
    damageRoll: z.string().optional(),
    armorBonus: z.number().optional(),
    properties: z.array(z.string())
  })),
  reviveAttempts: z.number().min(0).max(3),
  maxReviveAttempts: z.number().min(1).max(3),
  initiativeRoll: z.number().min(1).max(20).optional(),
  hasRolledInitiative: z.boolean()
});

// Schema para inimigo
const EnemySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  type: z.string().min(1).max(30),
  currentHP: z.number().min(0),
  maxHP: z.number().min(1),
  armorClass: z.number().min(1).max(30),
  attackBonus: z.number(),
  damageRoll: z.string().regex(/^\d+d\d+(\+\d+)?$/), // ex: "1d8+2"
  initiativeBonus: z.number(),
  resistances: z.array(z.enum(['PHYSICAL', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'FORCE'])),
  weaknesses: z.array(z.enum(['PHYSICAL', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'FORCE'])),
  immunities: z.array(z.enum(['PHYSICAL', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'FORCE'])),
  aiPattern: z.enum(['RANDOM', 'WEAKEST', 'CLOSEST', 'STRONGEST'])
});

// Schema para turno de combate
const CombatTurnSchema = z.object({
  combatantId: z.string().uuid(),
  combatantName: z.string(),
  combatantType: z.enum(['PLAYER', 'ENEMY']),
  turnNumber: z.number().min(1),
  roundNumber: z.number().min(1),
  timeRemaining: z.number().min(0),
  canSelectTarget: z.boolean(),
  availableTargets: z.array(z.string().uuid()),
  hasActed: z.boolean()
});

// Schema para resultado de ataque
const AttackResultSchema = z.object({
  attackerId: z.string().uuid(),
  targetId: z.string().uuid(),
  attackRoll: z.number().min(1).max(20),
  modifiers: z.number(),
  totalAttack: z.number(),
  targetAC: z.number().min(1).max(30),
  result: z.enum(['MISS', 'HIT', 'CRITICAL_HIT', 'CRITICAL_MISS']),
  damageRolled: z.boolean()
});

// Schema para resultado de dano
const DamageResultSchema = z.object({
  baseDamage: z.number().min(0),
  modifiers: z.number(),
  criticalMultiplier: z.number().min(1),
  resistanceMultiplier: z.number().min(0).max(2),
  finalDamage: z.number().min(0),
  damageType: z.enum(['PHYSICAL', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'FORCE']),
  target: z.object({
    id: z.string().uuid(),
    previousHP: z.number().min(0),
    newHP: z.number().min(0),
    isDead: z.boolean()
  })
});

// Schema para resultado de ressurreição
const ReviveResultSchema = z.object({
  characterId: z.string().uuid(),
  dice1: z.number().min(1).max(10),
  dice2: z.number().min(1).max(10),
  success: z.boolean(),
  attemptsUsed: z.number().min(1).max(3),
  attemptsRemaining: z.number().min(0).max(3),
  newHP: z.number().min(1).optional(),
  isPermanentlyDead: z.boolean()
});

// Schema para recompensas de combate
const CombatRewardsSchema = z.object({
  victory: z.boolean(),
  xpGained: z.number().min(0),
  xpPerParticipant: z.number().min(0),
  hpRecovered: z.number().min(0),
  itemsFound: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['WEAPON', 'ARMOR', 'POTION', 'TREASURE']),
    description: z.string(),
    value: z.number().min(0)
  })),
  goldGained: z.number().min(0),
  combatDuration: z.number().min(0),
  roundsCompleted: z.number().min(0)
});

// Schema para estatísticas do participante
const ParticipantStatsSchema = z.object({
  characterId: z.string().uuid(),
  characterName: z.string(),
  finalState: z.enum(['ALIVE', 'DEAD', 'PERMANENTLY_DEAD']),
  damageDealt: z.number().min(0),
  damageTaken: z.number().min(0),
  attacksAttempted: z.number().min(0),
  attacksHit: z.number().min(0),
  criticalHits: z.number().min(0),
  criticalMisses: z.number().min(0),
  reviveAttempts: z.number().min(0).max(3),
  survivedCombat: z.boolean()
});

// Schema para ação do inimigo
const EnemyActionSchema = z.object({
  enemyId: z.string().uuid(),
  enemyName: z.string(),
  action: z.enum(['ATTACK', 'DEFEND', 'SPECIAL_ABILITY']),
  targetId: z.string().uuid(),
  targetName: z.string(),
  reasoning: z.string()
});

// Schema para animação de dados
const DiceAnimationSchema = z.object({
  diceType: z.enum(['D20', 'D10', 'D8', 'D6', 'D4']),
  diceCount: z.number().min(1).max(10),
  results: z.array(z.number().min(1)),
  animationDuration: z.number().min(100),
  finalResult: z.number().min(1)
});

// Schema para atualização de combate
const CombatUpdateSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['INITIATIVE_ROLLED', 'TURN_STARTED', 'ATTACK_MADE', 'DAMAGE_DEALT', 'CHARACTER_DIED', 'REVIVE_ATTEMPTED', 'COMBAT_ENDED']),
  timestamp: z.date(),
  sessionId: z.string().uuid(),
  data: z.object({
    // Para INITIATIVE_ROLLED
    characterName: z.string().optional(),
    initiativeRoll: z.number().min(1).max(20).optional(),
    position: z.number().min(1).optional(),

    // Para TURN_STARTED
    currentTurn: CombatTurnSchema.optional(),

    // Para ATTACK_MADE
    attackResult: AttackResultSchema.optional(),

    // Para DAMAGE_DEALT
    damageResult: DamageResultSchema.optional(),

    // Para CHARACTER_DIED
    characterDied: z.object({
      id: z.string().uuid(),
      name: z.string(),
      canRevive: z.boolean()
    }).optional(),

    // Para REVIVE_ATTEMPTED
    reviveResult: ReviveResultSchema.optional(),

    // Para COMBAT_ENDED
    combatRewards: CombatRewardsSchema.optional()
  })
});

// Schema para requisição de rolagem de iniciativa
const RollInitiativeSchema = z.object({
  sessionId: z.string().uuid(),
  characterId: z.string().uuid()
});

// Schema para requisição de seleção de alvo
const SelectTargetSchema = z.object({
  sessionId: z.string().uuid(),
  attackerId: z.string().uuid(),
  targetId: z.string().uuid()
});

// Schema para requisição de ataque
const RollAttackSchema = z.object({
  sessionId: z.string().uuid(),
  attackerId: z.string().uuid(),
  targetId: z.string().uuid()
});

// Schema para requisição de tentativa de ressurreição
const AttemptReviveSchema = z.object({
  sessionId: z.string().uuid(),
  characterId: z.string().uuid()
});

// Schema para upload de arquivo Mermaid
const UploadMermaidFileSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'SHARED']).default('PRIVATE'),
  tags: z.array(z.string().max(50)).max(10, 'Máximo 10 tags').optional()
});

// Schema para votação com timeout automático
const StartVoteWithTimeoutSchema = z.object({
  sessionId: z.string().uuid(),
  question: z.string().min(1, 'Pergunta é obrigatória').max(500),
  options: z.array(z.string().min(1).max(200)).min(2, 'Mínimo 2 opções').max(6, 'Máximo 6 opções'),
  timeoutMinutes: z.number().int().min(1).max(60).default(5),
  autoFinish: z.boolean().default(true),
  allowTies: z.boolean().default(false)
});

// Schema para obter timeout de votação
const GetVoteTimeoutSchema = z.object({
  sessionId: z.string().uuid()
});

// Schema para estender timeout de votação
const ExtendVoteTimeoutSchema = z.object({
  sessionId: z.string().uuid(),
  additionalMinutes: z.number().int().min(1).max(30)
});

// Schema para resolver empate em votação
const ResolveVoteTieSchema = z.object({
  sessionId: z.string().uuid(),
  resolution: z.enum(['REVOTE', 'RANDOM', 'MASTER_DECIDES']),
  masterChoice: z.number().int().min(0).optional(),
  newTimeoutMinutes: z.number().int().min(1).max(30).default(3)
});

// Schema para iniciar re-votação
const StartRevoteSchema = z.object({
  sessionId: z.string().uuid(),
  tiedOptions: z.array(z.number().int().min(0)).min(2, 'Mínimo 2 opções empatadas'),
  timeoutMinutes: z.number().int().min(1).max(30).default(3)
});
```

## 8.3 Boas Práticas de Schemas Zod

### 1. Sempre use `.describe()` para documentação

```typescript
// ❌ Ruim - sem descrição
age: z.number().min(18).max(100)

// ✅ Bom - com descrição
age: z.number()
  .min(18, "Idade mínima 18 anos")
  .max(100, "Idade máxima 100 anos")
  .describe("Idade do personagem em anos")
```

### 2. Use mensagens de erro customizadas

```typescript
password: z.string()
  .min(6, "Senha deve ter no mínimo 6 caracteres")
  .max(50, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve ter ao menos uma letra maiúscula")
  .describe("Senha do usuário")
```

### 3. Use `.refine()` para validações complexas

```typescript
const RegisterSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});
```

### 4. Exporte e reutilize schemas

```typescript
// src/models/characterSchemas.ts
export const AttributesSchema = z.object({
  strength: z.number().min(3).max(18),
  dexterity: z.number().min(3).max(18),
  // ...
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(30),
  attributes: AttributesSchema, // Reutilização
  // ...
});
```

### 5. Use `.optional()` e `.default()` apropriadamente

```typescript
const CreateSessionSchema = z.object({
  name: z.string().min(1).max(50),
  maxPlayers: z.number().min(2).max(10).default(5), // Valor padrão
  isPrivate: z.boolean().optional(), // Campo opcional
  description: z.string().max(500).optional().default("") // Opcional com padrão
});
```

### 6. Valide tipos de enum com `.enum()`

```typescript
// ❌ Ruim
status: z.string()

// ✅ Bom
status: z.enum([
  "WAITING_PLAYERS",
  "CREATING_CHARACTERS",
  "IN_PROGRESS",
  "COMPLETED"
]).describe("Status atual da sessão")
```

### 7. Use `.transform()` para normalização

```typescript
const UsernameSchema = z.string()
  .min(3)
  .max(20)
  .transform(val => val.toLowerCase().trim())
  .describe("Nome de usuário (será normalizado para lowercase)");
```

### 8. Documente arrays e objetos aninhados

```typescript
equipment: z.array(z.string())
  .max(10, "Máximo 10 itens de equipamento")
  .describe("Lista de itens equipados pelo personagem")
```

## 8.4 Testando Schemas

```typescript
import { describe, it, expect } from "vitest";
import { CreateCharacterSchema } from "./characterSchemas";

describe("CreateCharacterSchema", () => {
  it("valida personagem válido", () => {
    const valid = {
      name: "Aragorn",
      race: "Humano",
      class: "Guerreiro",
      attributes: { strength: 16, dexterity: 13, constitution: 15, intelligence: 12, wisdom: 14, charisma: 11 },
      background: "Soldado experiente..."
    };

    const result = CreateCharacterSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejeita atributos inválidos", () => {
    const invalid = {
      name: "Aragorn",
      race: "Humano",
      class: "Guerreiro",
      attributes: { strength: 25, dexterity: 13 }, // strength > 18
      background: "Soldado..."
    };

    const result = CreateCharacterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

## 8.5 Integração com Fastify

### Setup inicial (server.ts)

```typescript
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler
} from "fastify-type-provider-zod";

const app = Fastify().withTypeProvider<ZodTypeProvider>();

// Configurar compiladores Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Registrar Swagger
await app.register(swagger, {
  openapi: {
    info: { title: "RPC API", version: "1.0.0" },
    servers: [{ url: "http://173.249.60.72:8443" }]
  }
});

await app.register(swaggerUI, {
  routePrefix: "/docs"
});

// Registrar rotas
await app.register(authRoutes);
await app.register(characterRoutes);
await app.register(sessionRoutes);

await app.listen({ port: 8443, host: "0.0.0.0" });
```

---

[← Anterior: APIs RPC](./07-apis-rpc.md) | [Voltar ao Menu](./README.md) | [Próximo: Estrutura de Arquivos →](./09-estrutura-arquivos.md)