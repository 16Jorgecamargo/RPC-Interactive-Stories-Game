# 2. Descrição Geral

## 2.1 Perspectiva do Produto
Sistema distribuído cliente-servidor onde múltiplos jogadores se conectam a um servidor central para participar de histórias interativas. O servidor mantém o estado da história em memória e coordena as decisões coletivas através de votação.

## 2.2 Funções do Produto
- **Gerenciamento de Salas**: Criar, listar, entrar e sair de salas de jogo
- **Sistema de Histórias**: Carregar e gerenciar histórias em formato JSON
- **Sistema de Votação**: Votação colaborativa para escolhas na história
- **Chat em Tempo Real**: Mensagens entre jogadores via long polling
- **Sistema de Eventos**: Notificações de mudanças de estado (players, votos, mensagens)
- **Navegação por Cards**: Avanço na história baseado em decisões coletivas
- **Votação para Exclusão de Sala**: Sistema colaborativo para deletar salas

## 2.3 Características dos Jogadores
- **Jogadores (sem autenticação)**:
  - Informam apenas um nome ao entrar (tela de login simples)
  - Criam salas escolhendo nome e história
  - Entram em salas existentes pelo ID
  - Votam nas escolhas da história através de interface React
  - Enviam mensagens de chat em tempo real
  - Podem iniciar votação para deletar sala
  - Recebem atualizações em tempo real via polling automático

## 2.4 Fluxo de Experiência do Usuário

### Fluxo Principal de Jogo

#### 1. Listar Histórias Disponíveis
```javascript
// Cliente chama listStories()
{
  "stories": [
    { "id": "caverna-misteriosa", "title": "A Caverna Misteriosa", "description": "..." },
    { "id": "navio-pirata", "title": "O Navio Pirata", "description": "..." },
    { "id": "reino-perdido", "title": "O Reino Perdido", "description": "..." }
  ]
}
```

#### 2. Criar Sala
```javascript
// Cliente chama createRoom(name, storyId)
{
  "roomId": "abc123xyz"
}
```

#### 3. Listar Salas
```javascript
// Cliente chama listRooms()
{
  "rooms": [
    {
      "id": "abc123xyz",
      "name": "Sala de Aventura",
      "storyTitle": "A Caverna Misteriosa",
      "playerCount": 3,
      "currentCard": "inicio"
    }
  ]
}
```

#### 4. Entrar na Sala
```javascript
// Cliente chama joinRoom(roomId, playerName)
{
  "playerId": "player-xyz789",
  "gameState": {
    "currentCard": { "id": "inicio", "text": "...", "choices": [...] },
    "players": [...],
    "votes": {...},
    "messages": [...]
  }
}
```

#### 5. Votar
```javascript
// Cliente chama vote(roomId, playerId, choiceId)
{
  "voteCount": 2,
  "totalPlayers": 3,
  "cardChanged": false
}

// Quando todos votam ou maioria escolhe a mesma opção:
{
  "voteCount": 3,
  "totalPlayers": 3,
  "cardChanged": true,
  "newCardId": "dentro-caverna"
}
```

#### 6. Enviar Mensagem
```javascript
// Cliente chama sendMessage(roomId, playerId, message)
{
  "message": {
    "id": "msg-123",
    "playerId": "player-xyz789",
    "playerName": "João",
    "message": "Vamos explorar a caverna!",
    "timestamp": 1234567890
  }
}
```

#### 7. Receber Eventos (Long Polling)
```javascript
// Cliente chama waitForEvents(roomId, lastEventId)
// Aguarda até novos eventos ou timeout (30s)
{
  "events": [
    { "id": 1, "type": "playerJoined", "data": {...} },
    { "id": 2, "type": "vote", "data": {...} },
    { "id": 3, "type": "message", "data": {...} },
    { "id": 4, "type": "cardChanged", "data": {...} }
  ],
  "lastEventId": 4
}
```

### Estados do Jogo

O jogo não tem estados formais de sessão como o sistema de referência. Cada sala existe enquanto:
- Houver pelo menos um jogador
- Não for deletada por votação
- O servidor estiver rodando

### Sistema de Votação para Deletar Sala

1. **Iniciação**: Qualquer jogador pode iniciar votação para deletar
   - `initiateDeleteRoom(roomId, playerId)`
   - Evento `deleteRoomInitiated` é disparado
   - Timeout de **60 segundos** é iniciado
   - Bloqueia nova votação durante os 60 segundos

2. **Votação**: Todos jogadores votam sim/não
   - `voteDeleteRoom(roomId, playerId, vote)`
   - Evento `deleteRoomVoted` é disparado com contagem
   - Cada jogador pode votar apenas uma vez (voto substituível)

3. **Resolução**:
   - **Aprovado**: Se **≥75%** dos jogadores votarem SIM → sala deletada
   - **Rejeitado**: Se matematicamente impossível atingir 75% → cancela votação antecipadamente
   - **Expirado**: Se timeout (60s) sem atingir 75% → cancela votação
   - **Imediato**: Se todos votarem e ≥75% SIM → deleta imediatamente sem esperar timeout

**Exemplo**:
- Sala com 4 jogadores → Aprovação requer 3 votos SIM (75%)
- Se 2 votarem NÃO → Votação cancelada (impossível atingir 75%)
- Se 3 votarem SIM → Sala deletada imediatamente

### Sistema de Eventos

Tipos de eventos disponíveis:
- `playerJoined`: Jogador entrou na sala
- `playerLeft`: Jogador saiu da sala
- `vote`: Jogador votou em uma escolha
- `cardChanged`: História avançou para novo card
- `message`: Nova mensagem de chat
- `deleteRoomInitiated`: Votação para deletar iniciada
- `deleteRoomVoted`: Voto para deletar registrado
- `roomDeleted`: Sala foi deletada
- `countdownStarted`: Contagem regressiva iniciada
- `countdownFinished`: Contagem regressiva finalizada

## 2.5 Estrutura de Dados

### História (Story)
```json
{
  "id": "caverna-misteriosa",
  "title": "A Caverna Misteriosa",
  "description": "Uma aventura em uma caverna cheia de mistérios",
  "cards": [
    {
      "id": "inicio",
      "text": "Vocês estão viajando por uma floresta...",
      "choices": [
        { "id": "investigar", "text": "Investigar a caverna", "nextCard": "dentro-caverna" },
        { "id": "fugir", "text": "Seguir viagem", "nextCard": "floresta" }
      ]
    }
  ]
}
```

### Sala (Room)
```typescript
{
  id: string;               // ID único da sala
  name: string;             // Nome dado pelo criador
  storyId: string;          // ID da história sendo jogada
  currentCardId: string;    // Card atual da narrativa
  players: Map<string, Player>;  // Jogadores na sala
  votes: Map<string, Vote>;      // Votos atuais
  messages: ChatMessage[];       // Histórico de chat
  events: GameEvent[];          // Eventos para polling
  eventIdCounter: number;       // Contador de IDs de eventos
}
```

---

[← Anterior: Introdução](./01-introducao.md) | [Voltar ao Menu](./README.md) | [Próximo: Requisitos Funcionais →](./03-requisitos-funcionais.md) 
