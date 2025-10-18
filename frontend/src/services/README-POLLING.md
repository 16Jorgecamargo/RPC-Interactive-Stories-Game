# Sistema Unificado de Long Polling

## Visão Geral

O `UnifiedPollingService` gerencia múltiplas verificações simultâneas em tempo real usando long polling HTTP. Este sistema permite que diferentes partes da aplicação recebam atualizações automáticas sem necessidade de WebSockets.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                  UnifiedPollingService                       │
│                        (Singleton)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Chat Polling  │  │Session Poll  │  │  Heartbeat   │     │
│  │   (5s)       │  │    (3s)      │  │    (10s)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Home Polling │  │ Details Poll │                        │
│  │   (15s)      │  │    (5s)      │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  Chat    │        │ Session  │        │  Backend │
    │ Service  │        │ Service  │        │   RPC    │
    └──────────┘        └──────────┘        └──────────┘
```

## Tipos de Polling

### 1. Chat Polling (`startChatPolling`)
**Propósito**: Buscar novas mensagens em tempo real  
**Intervalo padrão**: 5 segundos  
**Backoff**: Sim (até 30s quando sem atividade)  
**Uso**: Waiting Room, Game Screen

```javascript
unifiedPolling.startChatPolling(sessionId, (update) => {
  if (update.type === 'NEW_MESSAGES') {
    update.data.forEach(msg => renderMessage(msg));
  }
}, 5000);
```

**RPC Method**: `checkMessages`  
**Retorna**: Lista de mensagens desde `lastMessageId`

---

### 2. Session Polling (`startSessionPolling`)
**Propósito**: Monitorar mudanças na sessão (jogadores, status, personagens)  
**Intervalo padrão**: 3 segundos  
**Backoff**: Sim  
**Uso**: Waiting Room, Game Screen

```javascript
unifiedPolling.startSessionPolling(sessionId, (update) => {
  switch (update.type) {
    case 'PLAYER_JOINED':
      showNotification(`${update.data.username} entrou!`);
      break;
    case 'CHARACTER_CREATED':
      refreshParticipants();
      break;
    case 'GAME_STARTED':
      window.location.href = '/game.html';
      break;
  }
}, 3000);
```

**RPC Method**: `checkGameUpdates`  
**Retorna**: Lista de eventos desde `lastUpdateId`

**Tipos de Update**:
- `PLAYER_JOINED` - Jogador entrou na sessão
- `PLAYER_LEFT` - Jogador saiu da sessão
- `CHARACTER_CREATED` - Personagem foi criado
- `CHARACTER_UPDATED` - Personagem foi editado
- `ALL_CHARACTERS_READY` - Todos personagens prontos
- `SESSION_STATE_CHANGED` - Status da sessão mudou
- `GAME_STARTED` - Jogo iniciou
- `SESSION_DELETED` - Sessão foi deletada
- `VOTE_RECEIVED` - Voto recebido
- `CHAPTER_CHANGED` - Capítulo mudou
- `COMBAT_STARTED` - Combate iniciou
- `ATTACK_MADE` - Ataque realizado

---

### 3. Heartbeat (`startHeartbeat`)
**Propósito**: Manter status online do jogador  
**Intervalo padrão**: 10 segundos  
**Backoff**: Não (intervalo fixo)  
**Uso**: Waiting Room, Game Screen

```javascript
unifiedPolling.startHeartbeat(sessionId, 10000);
```

**RPC Method**: `updatePlayerStatus`  
**Efeito**: Atualiza `isOnline: true` e `lastActivity` do jogador

**Importante**: Backend detecta jogadores offline quando `lastActivity > 30 segundos`

---

### 4. Home Polling (`startHomePolling`)
**Propósito**: Atualizar lista de sessões na home page  
**Intervalo padrão**: 15 segundos  
**Backoff**: Não (intervalo fixo)  
**Uso**: Home Page

```javascript
unifiedPolling.startHomePolling((update) => {
  if (update.type === 'SESSIONS_UPDATE') {
    renderSessions(update.data);
  }
}, 15000);
```

**RPC Method**: `listMySessions`  
**Retorna**: Lista completa de sessões do usuário com:
- Número de participantes
- Jogadores online (`onlineCount`)
- Status atualizado
- Última atividade
- Nome do personagem criado

**Detecta mudanças em**:
- Número de participantes
- Jogadores online/offline
- Status da sessão (WAITING → IN_PROGRESS → COMPLETED)
- Última atividade
- Criação de personagens

---

### 5. Session Details Polling (`startSessionDetailsPolling`)
**Propósito**: Monitorar detalhes específicos de uma sessão  
**Intervalo padrão**: 5 segundos  
**Backoff**: Não  
**Uso**: Admin Panel, Session Management

```javascript
unifiedPolling.startSessionDetailsPolling(sessionId, (update) => {
  if (update.type === 'SESSION_DETAILS_UPDATE') {
    updateSessionCard(update.data);
  }
}, 5000);
```

**RPC Method**: `getSessionDetails`  
**Retorna**: Objeto completo da sessão com participantes enriquecidos

---

## Gerenciamento de Pollers

### Iniciar Poller
```javascript
// Chat
unifiedPolling.startChatPolling(sessionId, callback, interval);

// Sessão
unifiedPolling.startSessionPolling(sessionId, callback, interval);

// Heartbeat
unifiedPolling.startHeartbeat(sessionId, interval);

// Home
unifiedPolling.startHomePolling(callback, interval);
```

### Parar Pollers
```javascript
// Parar poller específico
unifiedPolling.stopPoller('chat_session123');

// Parar todos pollers de uma sessão
unifiedPolling.stopSessionPollers(sessionId);

// Parar TODOS os pollers
unifiedPolling.stopAll();
```

### Verificar Status
```javascript
// Verificar se poller está ativo
const isActive = unifiedPolling.isPollerActive('chat_session123');

// Ver estatísticas
const stats = unifiedPolling.getStats();
console.log(stats); 
// { activePollers: 3, pollers: ['chat_session123', 'session_session123', 'heartbeat_session123'] }
```

---

## Backoff Exponencial

Pollers com backoff ajustam automaticamente o intervalo baseado na atividade:

```
Intervalo Base: 5s
Sem atividade: 5s → 7.5s → 11.25s → 16.875s → 25.3s → 30s (max)
Com atividade: Reset para 5s
```

**Multiplier**: 1.5x  
**Intervalo Máximo**: 30 segundos

**Pollers COM backoff**:
- Chat Polling
- Session Polling

**Pollers SEM backoff** (intervalo fixo):
- Heartbeat
- Home Polling
- Session Details Polling

---

## Padrão de Uso Completo

### Waiting Room
```javascript
import { unifiedPolling } from '../../services/unifiedPollingService.js';

const sessionId = 'session_123';

// 1. Chat em tempo real
unifiedPolling.startChatPolling(sessionId, (update) => {
  if (update.type === 'NEW_MESSAGES') {
    renderMessages(update.data);
  }
}, 5000);

// 2. Atualizações da sessão
unifiedPolling.startSessionPolling(sessionId, (update) => {
  switch (update.type) {
    case 'PLAYER_JOINED':
      refreshParticipants();
      showNotification(`${update.data.username} entrou!`);
      break;
    case 'GAME_STARTED':
      window.location.href = '/game.html';
      break;
  }
}, 3000);

// 3. Manter status online
unifiedPolling.startHeartbeat(sessionId, 10000);

// 4. Limpar ao sair
window.addEventListener('beforeunload', () => {
  unifiedPolling.stopSessionPollers(sessionId);
});
```

### Home Page
```javascript
import { unifiedPolling } from '../services/unifiedPollingService.js';

// Polling da lista de sessões
unifiedPolling.startHomePolling((update) => {
  if (update.type === 'SESSIONS_UPDATE') {
    const sessions = update.data;
    renderSessionCards(sessions);
  }
}, 15000);

// Limpar ao sair
window.addEventListener('beforeunload', () => {
  unifiedPolling.stopPoller('home_sessions');
});
```

---

## Backend: Event Store

O backend usa um sistema de eventos (`event_store.ts`) para armazenar atualizações:

```typescript
// Adicionar evento
const update: GameUpdate = {
  id: `update_${uuid()}`,
  type: 'PLAYER_JOINED',
  timestamp: new Date().toISOString(),
  sessionId: session.id,
  data: { userId, username }
};
eventStore.addUpdate(update);

// Buscar eventos
const updates = eventStore.findUpdatesBySessionId(sessionId, lastUpdateId);
```

**Armazenamento**: `backend/data/events.json`  
**Estrutura**: Array de `GameUpdate` objects  
**Limpeza**: Manual (não há TTL automático)

---

## Desempenho e Otimizações

### 1. Deduplicação
Frontend mantém Set de IDs já processados:
```javascript
let loadedMessageIds = new Set();

messages.forEach(msg => {
  if (!loadedMessageIds.has(msg.id)) {
    loadedMessageIds.add(msg.id);
    renderMessage(msg);
  }
});
```

### 2. Backoff Inteligente
Reduz carga quando não há atividade:
- Com usuários ativos: polling rápido (3-5s)
- Sem atividade: polling lento (até 30s)

### 3. Single Tab Management
Usa `tabManager` para garantir que apenas uma aba por navegador faça polling:
```javascript
tabManager.init(
  () => unifiedPolling.stopAll(),      // Bloqueado
  () => startUnifiedPolling(sessionId) // Desbloqueado
);
```

### 4. Offline Detection
Backend marca usuário offline quando:
```
lastActivity < (now - 30 segundos)
```

Heartbeat a cada 10s garante status online atualizado.

---

## Troubleshooting

### Polling não inicia
```javascript
// Verificar se está ativo
console.log(unifiedPolling.getStats());

// Verificar token
const token = getToken();
console.log('Token:', token ? 'OK' : 'MISSING');
```

### Mensagens duplicadas
```javascript
// Usar Set para deduplicação
let loadedIds = new Set();
messages.forEach(msg => {
  if (!loadedIds.has(msg.id)) {
    loadedIds.add(msg.id);
    // Processar mensagem
  }
});
```

### Polling muito agressivo
```javascript
// Aumentar intervalos
unifiedPolling.startChatPolling(sessionId, callback, 10000); // 10s em vez de 5s
```

### Backend retorna erro 403
```javascript
// Verificar se usuário é participante
// Backend valida: session.participants.some(p => p.userId === userId)
```

---

## Diferenças vs WebSocket

| Aspecto | Long Polling (Atual) | WebSocket |
|---------|---------------------|-----------|
| Conexão | HTTP requests | Persistent connection |
| Latência | 1-5s | <100ms |
| Overhead | Médio (HTTP headers) | Baixo |
| Firewall | ✅ Funciona sempre | ❌ Pode ser bloqueado |
| Complexidade | Baixa | Alta |
| Escalabilidade | Boa | Excelente |
| Fallback | Não precisa | Sim (para long polling) |

**Por que Long Polling?**
- Sistema distribuído (VPS remoto + cliente local)
- Funciona com CORS sem configuração complexa
- Não requer infraestrutura de WebSocket
- Latência aceitável para RPG turn-based
- Mais simples de debugar e manter

---

## Próximas Melhorias

1. **TTL Automático** - Limpar eventos antigos do event_store
2. **Compressão** - Gzip nos payloads grandes
3. **Conditional Polling** - Pausar quando aba não está visível
4. **Batch Updates** - Agrupar múltiplos updates em um response
5. **ETag/If-Modified-Since** - Reduzir transferência quando nada mudou
6. **Service Worker** - Background sync quando offline

---

## Referências

- **Backend**: `backend/src/services/update_service.ts`
- **Frontend**: `frontend/src/services/unifiedPollingService.js`
- **Schemas**: `backend/src/models/update_schemas.ts`
- **Event Store**: `backend/src/stores/event_store.ts`
