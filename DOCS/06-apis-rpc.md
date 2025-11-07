# 6. Especificação das APIs JSON-RPC

## 6.1 Endpoint

Todas as chamadas RPC são feitas via:
- **URL**: `http://localhost:3000/rpc`
- **Método HTTP**: `POST`
- **Content-Type**: `application/json`

## 6.2 Métodos Disponíveis

### 6.2.1 listStories

Lista todas as histórias disponíveis no servidor.

**Parâmetros**: Nenhum

**Retorno**:
```typescript
{
  stories: Array<{
    id: string;
    title: string;
    description?: string;
  }>
}
```

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "listStories",
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "stories": [
      {
        "id": "caverna-misteriosa",
        "title": "A Caverna Misteriosa",
        "description": "Uma aventura em uma caverna cheia de mistérios"
      },
      {
        "id": "navio-pirata",
        "title": "O Navio Pirata",
        "description": "Aventura nos sete mares"
      }
    ]
  },
  "id": 1
}
```

---

### 6.2.2 createRoom

Cria uma nova sala de jogo.

**Parâmetros**:
```typescript
{
  name: string;      // Nome da sala (mínimo 1 caractere)
  storyId: string;   // ID da história a ser jogada
}
```

**Retorno**:
```typescript
{
  roomId: string;    // ID único da sala criada
}
```

**Erros**:
- `-32602`: Parâmetros inválidos (name vazio ou storyId inválido)
- `-32001`: História não encontrada

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "createRoom",
  "params": {
    "name": "Sala de Aventura",
    "storyId": "caverna-misteriosa"
  },
  "id": 2
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "roomId": "Xkd9_mK2pQz"
  },
  "id": 2
}
```

---

### 6.2.3 listRooms

Lista todas as salas ativas no servidor.

**Parâmetros**: Nenhum

**Retorno**:
```typescript
{
  rooms: Array<{
    id: string;
    name: string;
    storyTitle: string;
    playerCount: number;
  }>
}
```

**Observação**: `currentCard` não é exposto em `listRooms` por questões de privacidade. Use `getGameState` após entrar na sala para obter o card atual.

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "listRooms",
  "id": 3
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "rooms": [
      {
        "id": "Xkd9_mK2pQz",
        "name": "Sala de Aventura",
        "storyTitle": "A Caverna Misteriosa",
        "playerCount": 2
      }
    ]
  },
  "id": 3
}
```

---

### 6.2.4 joinRoom

Entra em uma sala existente.

**Parâmetros**:
```typescript
{
  roomId: string;       // ID da sala
  playerName: string;   // Nome do jogador (mínimo 1 caractere)
}
```

**Retorno**:
```typescript
{
  playerId: string;     // ID único do jogador
  gameState: {
    currentCard: {
      id: string;
      text: string;
      choices: Array<{
        id: string;
        text: string;
        nextCard: string;
      }>;
    };
    players: Array<{
      id: string;
      name: string;
      joinedAt: number;
    }>;
    votes: Record<string, {  // playerId → vote
      playerId: string;
      choiceId: string;
      timestamp: number;
    }>;
    messages: Array<{
      id: string;
      playerId: string;
      playerName: string;
      message: string;
      timestamp: number;
      isSystem?: boolean;
    }>;
    lastEventId: number;  // ID do último evento
    countdowns: Array<{   // Countdowns ativos
      countdownType: 'vote' | 'card';
      durationMs: number;
      startedAt: number;  // Timestamp Unix em ms
    }>;
  }
}
```

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala não encontrada

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "joinRoom",
  "params": {
    "roomId": "Xkd9_mK2pQz",
    "playerName": "João"
  },
  "id": 4
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "playerId": "player-abc123",
    "gameState": {
      "currentCard": {
        "id": "inicio",
        "text": "Vocês estão viajando por uma floresta...",
        "choices": [
          { "id": "investigar", "text": "Investigar a caverna", "nextCard": "dentro-caverna" },
          { "id": "fugir", "text": "Seguir viagem", "nextCard": "floresta" }
        ]
      },
      "players": [
        { "id": "player-xyz", "name": "Maria", "joinedAt": 1234567890 },
        { "id": "player-abc123", "name": "João", "joinedAt": 1234567900 }
      ],
      "votes": {},
      "messages": [
        {
          "id": "msg-1",
          "playerId": "system",
          "playerName": "Sistema",
          "message": "João entrou na sala",
          "timestamp": 1234567900,
          "isSystem": true
        }
      ]
    }
  },
  "id": 4
}
```

---

### 6.2.5 leaveRoom

Sai de uma sala.

**Parâmetros**:
```typescript
{
  roomId: string;
  playerId: string;
}
```

**Retorno**:
```typescript
{
  success: boolean;
}
```

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala ou jogador não encontrado

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "leaveRoom",
  "params": {
    "roomId": "Xkd9_mK2pQz",
    "playerId": "player-abc123"
  },
  "id": 5
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "success": true
  },
  "id": 5
}
```

---

### 6.2.6 getGameState

Obtém o estado atual de uma sala.

**Parâmetros**:
```typescript
{
  roomId: string;
}
```

**Retorno**: Mesmo formato de `gameState` do `joinRoom`, incluindo:
- `currentCard`: Card ativo com choices
- `players`: Lista de jogadores na sala
- `votes`: Map de votos (playerId → voto)
- `messages`: Últimas 50 mensagens do chat
- `lastEventId`: ID do último evento gerado
- `countdowns`: Array de countdowns ativos (vote/card)

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala não encontrada

---

### 6.2.7 vote

Registra voto de um jogador em uma escolha.

**Parâmetros**:
```typescript
{
  roomId: string;
  playerId: string;
  choiceId: string;
}
```

**Retorno**:
```typescript
{
  voteCount: Record<string, number>;  // Map: choiceId → número de votos
}
```

**Observações**:
- Mudança de card é comunicada via evento `cardChanged` no long polling
- Se primeiro voto: inicia countdown de 15 segundos (evento `countdownStarted`)
- Se todos votaram: finaliza votação imediatamente
- Após votação: aguarda 3 segundos (countdown de card) antes de mudar

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala, jogador ou escolha não encontrada

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "vote",
  "params": {
    "roomId": "Xkd9_mK2pQz",
    "playerId": "player-abc123",
    "choiceId": "investigar"
  },
  "id": 6
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "voteCount": {
      "investigar": 2,
      "fugir": 0
    }
  },
  "id": 6
}

// Eventos subsequentes (via waitForEvents)
// 1. countdownStarted (se primeiro voto)
// 2. countdownFinished (após 15s ou todos votarem)
// 3. countdownStarted (tipo: card, 3s de espera)
// 4. countdownFinished (tipo: card)
// 5. cardChanged (newCardId: "dentro-caverna")
```

---

### 6.2.8 sendMessage

Envia mensagem de chat.

**Parâmetros**:
```typescript
{
  roomId: string;
  playerId: string;
  message: string;    // Mínimo 1 caractere
}
```

**Retorno**:
```typescript
{
  message: {
    id: string;
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
  }
}
```

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala ou jogador não encontrado

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "sendMessage",
  "params": {
    "roomId": "Xkd9_mK2pQz",
    "playerId": "player-abc123",
    "message": "Vamos investigar a caverna!"
  },
  "id": 7
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "message": {
      "id": "msg-xyz789",
      "playerId": "player-abc123",
      "playerName": "João",
      "message": "Vamos investigar a caverna!",
      "timestamp": 1234567950
    }
  },
  "id": 7
}
```

---

### 6.2.9 waitForEvents

Aguarda novos eventos (long polling).

**Parâmetros**:
```typescript
{
  roomId: string;
  lastEventId: number;   // Último ID recebido (0 para início)
}
```

**Retorno**:
```typescript
{
  events: Array<GameEvent>;  // Eventos com id > lastEventId
  lastEventId: number;       // ID do último evento retornado
}
```

**Comportamento**:
- Se há eventos novos: retorna imediatamente
- Se não há eventos: aguarda até 30 segundos ou novos eventos
- Retorna array vazio se timeout sem eventos

**Tipos de Eventos**:
```typescript
type GameEvent =
  | { id: number; type: 'playerJoined'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'playerLeft'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'vote'; data: { playerId: string; playerName: string; choiceId: string } }
  | { id: number; type: 'cardChanged'; data: { newCardId: string } }
  | { id: number; type: 'message'; data: ChatMessage }
  | { id: number; type: 'deleteRoomInitiated'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'deleteRoomVoted'; data: { yesVotes: number; noVotes: number; total: number } }
  | { id: number; type: 'roomDeleted'; data: { reason: string } }
  | { id: number; type: 'countdownStarted'; data: { countdownType: 'vote' | 'card'; durationMs: number } }
  | { id: number; type: 'countdownFinished'; data: { countdownType: 'vote' | 'card'; reason: string } };
```

**Detalhes dos Eventos de Countdown**:

- **countdownStarted**:
  - `countdownType: 'vote'` → Countdown de 15s para votação (após primeiro voto)
  - `countdownType: 'card'` → Countdown de 3s antes de mudar card
  - `durationMs`: Duração total em milissegundos

- **countdownFinished**:
  - `reason`: "timeout" (expirou), "allVoted" (todos votaram), "cancelled" (sala vazia/deletada)

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala não encontrada

**Exemplo**:
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "waitForEvents",
  "params": {
    "roomId": "Xkd9_mK2pQz",
    "lastEventId": 0
  },
  "id": 8
}

// Response (após receber eventos)
{
  "jsonrpc": "2.0",
  "result": {
    "events": [
      {
        "id": 1,
        "type": "playerJoined",
        "data": { "playerId": "player-abc123", "playerName": "João" }
      },
      {
        "id": 2,
        "type": "vote",
        "data": { "playerId": "player-abc123", "playerName": "João", "choiceId": "investigar" }
      },
      {
        "id": 3,
        "type": "cardChanged",
        "data": { "newCardId": "dentro-caverna" }
      }
    ],
    "lastEventId": 3
  },
  "id": 8
}
```

---

### 6.2.10 initiateDeleteRoom

Inicia votação para deletar sala.

**Parâmetros**:
```typescript
{
  roomId: string;
  playerId: string;
}
```

**Retorno**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala ou jogador não encontrado
- `-32603`: Votação já em andamento

---

### 6.2.11 voteDeleteRoom

Vota na exclusão de sala.

**Parâmetros**:
```typescript
{
  roomId: string;
  playerId: string;
  vote: boolean;     // true = SIM, false = NÃO
}
```

**Retorno**:
```typescript
{
  yesVotes: number;   // Total de votos SIM
  noVotes: number;    // Total de votos NÃO
  total: number;      // Total de jogadores
  approved: boolean;  // true se sala foi deletada (≥75%)
}
```

**Critério de Aprovação**:
- Requer **≥75%** de votos SIM para deletar
- Se matematicamente impossível atingir 75%: votação cancelada antecipadamente
- Timeout de 60 segundos se não atingir critério
- Exemplo: Sala com 4 jogadores requer 3 votos SIM

**Erros**:
- `-32602`: Parâmetros inválidos
- `-32001`: Sala ou jogador não encontrado
- `-32603`: Nenhuma votação em andamento

---

## 6.3 Códigos de Erro JSON-RPC

| Código | Nome | Descrição |
|--------|------|-----------|
| -32700 | Parse error | JSON inválido |
| -32600 | Invalid Request | Requisição JSON-RPC inválida |
| -32601 | Method not found | Método não existe |
| -32602 | Invalid params | Parâmetros inválidos (falha Zod) |
| -32603 | Internal error | Erro interno do servidor |
| -32001 | Resource not found | Recurso não encontrado (custom) |

---

[← Anterior: Arquitetura](./05-arquitetura.md) | [Voltar ao Menu](./README.md) | [Próximo: Estrutura de Dados →](./07-estrutura-dados.md) 
