# 7. Estrutura de Dados e Schemas

## 7.1 Schemas Zod (types.ts)

### 7.1.1 JSON-RPC Base

```typescript
// Requisição JSON-RPC 2.0
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

// Resposta JSON-RPC 2.0
export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});
```

### 7.1.2 Estrutura de Histórias

```typescript
// Escolha em um card
export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  nextCard: z.string(),
});

// Card da história (cena/capítulo)
export const CardSchema = z.object({
  id: z.string(),
  text: z.string(),
  choices: z.array(ChoiceSchema),
});

// História completa
export const StorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  cards: z.array(CardSchema),
});

export type Choice = z.infer<typeof ChoiceSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Story = z.infer<typeof StorySchema>;
```

### 7.1.3 Schemas de Parâmetros RPC

```typescript
// createRoom
export const CreateRoomParamsSchema = z.object({
  name: z.string().min(1),
  storyId: z.string(),
});

// joinRoom
export const JoinRoomParamsSchema = z.object({
  roomId: z.string(),
  playerName: z.string().min(1),
});

// leaveRoom
export const LeaveRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

// vote
export const VoteParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  choiceId: z.string(),
});

// sendMessage
export const SendMessageParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  message: z.string().min(1),
});

// getGameState
export const GetGameStateParamsSchema = z.object({
  roomId: z.string(),
});

// waitForEvents
export const WaitForEventsParamsSchema = z.object({
  roomId: z.string(),
  lastEventId: z.number(),
});

// initiateDeleteRoom
export const InitiateDeleteRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

// voteDeleteRoom
export const VoteDeleteRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  vote: z.boolean(),
});
```

## 7.2 Interfaces TypeScript

### 7.2.1 Entidades de Jogo

```typescript
// Jogador
export interface Player {
  id: string;           // Gerado com nanoid
  name: string;         // Nome informado pelo jogador
  joinedAt: number;     // Timestamp Unix (ms)
}

// Voto
export interface Vote {
  playerId: string;     // ID do jogador que votou
  choiceId: string;     // ID da escolha votada
  timestamp: number;    // Timestamp Unix (ms)
}

// Mensagem de Chat
export interface ChatMessage {
  id: string;           // Gerado com nanoid
  playerId: string;     // ID do jogador (ou 'system')
  playerName: string;   // Nome do jogador (ou 'Sistema')
  message: string;      // Conteúdo da mensagem
  timestamp: number;    // Timestamp Unix (ms)
  isSystem?: boolean;   // true para mensagens do sistema
}

// Voto para deletar sala
export interface DeleteRoomVote {
  playerId: string;     // ID do jogador
  vote: boolean;        // true = SIM, false = NÃO
  timestamp: number;    // Timestamp Unix (ms)
}

// Sala de jogo
export interface Room {
  id: string;                           // Gerado com nanoid
  name: string;                         // Nome dado pelo criador
  storyId: string;                      // ID da história sendo jogada
  currentCardId: string;                // ID do card atual
  players: Map<string, Player>;         // playerId → Player
  votes: Map<string, Vote>;             // playerId → Vote
  messages: ChatMessage[];              // Array de mensagens
  createdAt: number;                    // Timestamp de criação
  events: GameEvent[];                  // Array de eventos
  eventIdCounter: number;               // Contador incremental de IDs
  deleteRoomVotes?: Map<string, DeleteRoomVote>;  // Votos para deletar
  deleteRoomInitiatedAt?: number;       // Timestamp de início da votação
}
```

### 7.2.2 Eventos

```typescript
export type GameEvent =
  // Jogador entrou na sala
  | {
      id: number;
      type: 'playerJoined';
      data: {
        playerId: string;
        playerName: string;
      };
    }
  // Jogador saiu da sala
  | {
      id: number;
      type: 'playerLeft';
      data: {
        playerId: string;
        playerName: string;
      };
    }
  // Jogador votou
  | {
      id: number;
      type: 'vote';
      data: {
        playerId: string;
        playerName: string;
        choiceId: string;
      };
    }
  // História avançou para novo card
  | {
      id: number;
      type: 'cardChanged';
      data: {
        newCardId: string;
      };
    }
  // Nova mensagem de chat
  | {
      id: number;
      type: 'message';
      data: ChatMessage;
    }
  // Votação para deletar iniciada
  | {
      id: number;
      type: 'deleteRoomInitiated';
      data: {
        playerId: string;
        playerName: string;
      };
    }
  // Voto para deletar registrado
  | {
      id: number;
      type: 'deleteRoomVoted';
      data: {
        playerId: string;
        playerName: string;
        vote: boolean;
        yesVotes: number;
        noVotes: number;
        total: number;
      };
    }
  // Sala foi deletada
  | {
      id: number;
      type: 'roomDeleted';
      data: {
        reason: string;
      };
    }
  // Contagem regressiva iniciada
  | {
      id: number;
      type: 'countdownStarted';
      data: {
        countdownType: 'vote' | 'card';
        durationMs: number;
        startedAt: number;
      };
    }
  // Contagem regressiva finalizada
  | {
      id: number;
      type: 'countdownFinished';
      data: {
        countdownType: 'vote' | 'card';
        reason?: string;
      };
    };
```

### 7.2.3 Tipos de Countdown

```typescript
// Estado de countdown para o cliente
export interface CountdownState {
  countdownType: 'vote' | 'card';
  durationMs: number;     // Duração total em ms
  startedAt: number;      // Timestamp de início (Unix ms)
}

// Rastreador interno de countdown (backend)
interface CountdownTracker {
  timeout: NodeJS.Timeout;  // Referência do setTimeout
  startedAt: number;        // Timestamp de início
  durationMs: number;       // Duração configurada
}

// Rastreador de countdown de card (estende CountdownTracker)
interface CardCountdownTracker extends CountdownTracker {
  targetCardId: string;     // Card de destino após countdown
}
```

**Duração dos Countdowns**:
- **Vote Countdown**: 15.000ms (15 segundos) - Inicia no primeiro voto
- **Card Countdown**: 3.000ms (3 segundos) - Inicia após votação finalizar

**Gerenciamento** (`room-manager.ts`):
```typescript
private voteCountdowns: Map<string, CountdownTracker> = new Map();
private cardCountdowns: Map<string, CardCountdownTracker> = new Map();

// Métodos
private startVoteCountdown(room: Room, durationMs: number): void
private clearVoteCountdown(roomId: string): void
private startCardCountdown(room: Room, newCardId: string, durationMs: number): void
private clearCardCountdown(roomId: string): void
private getCountdownState(roomId: string): CountdownState[]
```

## 7.3 Exemplo de História JSON

### 7.3.1 Estrutura Completa

```json
{
  "id": "caverna-misteriosa",
  "title": "A Caverna Misteriosa",
  "description": "Uma aventura em uma caverna cheia de mistérios",
  "cards": [
    {
      "id": "inicio",
      "text": "Vocês estão viajando por uma floresta densa quando ouvem um barulho estranho vindo de uma caverna próxima. O som parece um gemido baixo, quase inumano. O que vocês fazem?",
      "choices": [
        {
          "id": "investigar",
          "text": "Investigar a caverna",
          "nextCard": "dentro-caverna"
        },
        {
          "id": "fugir",
          "text": "Seguir viagem e ignorar o barulho",
          "nextCard": "floresta"
        },
        {
          "id": "observar",
          "text": "Observar de longe antes de decidir",
          "nextCard": "observando"
        }
      ]
    },
    {
      "id": "dentro-caverna",
      "text": "Vocês entram cautelosamente na caverna...",
      "choices": [
        {
          "id": "ajudar",
          "text": "Tentar ajudar o dragão",
          "nextCard": "ajudando-dragao"
        },
        {
          "id": "fugir-dragao",
          "text": "Fugir antes que ele os veja",
          "nextCard": "fuga"
        }
      ]
    },
    {
      "id": "vitoria",
      "text": "Parabéns! Vocês completaram a aventura com sucesso...",
      "choices": []
    }
  ]
}
```

### 7.3.2 Regras de Validação

1. **ID único**: Cada card deve ter um `id` único dentro da história
2. **Card inicial**: Sempre deve existir um card com id "inicio"
3. **nextCard válido**: Todos `nextCard` devem apontar para cards existentes
4. **Cards finais**: Cards sem choices (`choices: []`) são finais
5. **Texto obrigatório**: Todos cards e choices devem ter `text`

## 7.4 Estado de Sala em Memória

### 7.4.1 Exemplo de Room

```typescript
{
  id: "Xkd9_mK2pQz",
  name: "Sala de Aventura",
  storyId: "caverna-misteriosa",
  currentCardId: "dentro-caverna",
  createdAt: 1234567700000
}
```

### 7.4.2 Gerenciador de Salas

```typescript
// room-manager.ts
const rooms = new Map<string, Room>();

// Operações
rooms.set(roomId, room);        // Criar sala
rooms.get(roomId);              // Buscar sala
rooms.delete(roomId);           // Deletar sala
rooms.has(roomId);              // Verificar existência
Array.from(rooms.values());     // Listar todas
```

### 7.4.3 Gerenciador de Histórias

```typescript
// story-manager.ts
const stories = new Map<string, Story>();

// Carregadas de stories/*.json na inicialização
stories.set(story.id, story);
stories.get(storyId);
Array.from(stories.values());
```

## 7.5 Fluxo de Dados Completo

### 7.5.1 Criação de Sala

```
1. Cliente → createRoom("Sala 1", "caverna-misteriosa")
2. room-manager:
   - Valida storyId com story-manager
   - Cria Room com nanoid()
   - Busca story.cards[0] (card inicial)
   - Define currentCardId = "inicio"
   - Adiciona ao Map de rooms
3. Retorna → { roomId: "Xkd9_mK2pQz" }
```

### 7.5.2 Entrada na Sala

```
1. Cliente → joinRoom("Xkd9_mK2pQz", "João")
2. room-manager:
   - Valida roomId
   - Cria Player com nanoid()
   - Adiciona ao room.players
   - Incrementa eventIdCounter
   - Adiciona evento playerJoined
   - Adiciona mensagem do sistema
   - Busca card atual da história
3. Retorna → { playerId, gameState }
```

### 7.5.3 Votação com Countdowns

```
1. Cliente → vote("Xkd9_mK2pQz", "player-abc123", "investigar")

2. room-manager:
   - Valida sala, player, choice
   - Adiciona/substitui em room.votes
   - Adiciona evento vote

   - Se PRIMEIRO voto no card atual:
     * Inicia countdown de votação (15s)
     * Adiciona evento countdownStarted (type: 'vote')

   - Se TODOS votaram (players.size === votes.size):
     * Cancela countdown de votação
     * Adiciona evento countdownFinished (reason: 'allVoted')
     * Finaliza votação imediatamente

   - Ao finalizar votação (timeout ou todos votaram):
     * Determina escolha vencedora (maioria simples)
     * Inicia countdown de card (3s)
     * Adiciona evento countdownStarted (type: 'card')

   - Após countdown de card:
     * Busca choice.nextCard
     * Atualiza currentCardId
     * Limpa room.votes
     * Adiciona evento countdownFinished (type: 'card')
     * Adiciona evento cardChanged

3. Retorna → { voteCount: Record<string, number> }
   - cardChanged notificado via eventos, não retorno direto
```

### 7.5.4 Long Polling

```
1. Cliente → waitForEvents("Xkd9_mK2pQz", 5)
2. room-manager:
   - Filtra events com id > 5
   - Se há eventos: retorna imediatamente
   - Se não há: aguarda Promise.race([
       timeout(30000),
       waitForNewEvent()
     ])
   - Retorna eventos novos quando disponíveis
3. Cliente recebe → { events: [...], lastEventId: 8 }
4. Cliente → waitForEvents("Xkd9_mK2pQz", 8) [loop]
```

---

[← Anterior: APIs RPC](./06-apis-rpc.md) | [Voltar ao Menu](./README.md)
