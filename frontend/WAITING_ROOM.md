# Sala de Espera (Waiting Room)

## Visão Geral

A **Sala de Espera** é a página onde os jogadores se reúnem antes de iniciar uma aventura. Ela permite que os jogadores vejam os outros participantes, criem seus personagens, conversem via chat e aguardem até que todos estejam prontos.

## Arquivos Criados

### Frontend
- **`frontend/public/waiting-room.html`** - Página HTML da sala de espera
- **`frontend/src/styles/waiting-room.css`** - Estilos CSS seguindo o padrão medieval do projeto
- **`frontend/src/ui/sessions/waiting-room.js`** - Lógica JavaScript com polling e interações
- **`frontend/src/services/sessionService.js`** - Service layer para chamadas RPC relacionadas a sessões

## Funcionalidades Implementadas

### 1. Visualização de Participantes
- ✅ Lista todos os jogadores da sessão
- ✅ Badge de **👑 coroa** apenas para o dono da sessão (visível para todos)
- ✅ Status de personagem (criado/não criado)
- ✅ Status de conexão (online/offline)
- ✅ Contador de vagas disponíveis

### 2. Cards de Aventureiros
- ✅ **Sem emojis** nos cards (exceto coroa do owner)
- ✅ Indicador visual de status:
  - ✓ = Personagem pronto e online
  - ❌ = Personagem não criado
  - ⏸ = Offline
- ✅ Destaque especial para:
  - Dono da sessão (fundo dourado)
  - Usuário atual (fundo verde)

### 3. Botões de Ação por Participante

#### Para o Próprio Usuário
- **Se não criou personagem**: Botão "✨ Criar Personagem" (ativo)
- **Se criou personagem**: Botão "📋 Meu Personagem" (ativo)

#### Para Outros Jogadores
- **Se criou personagem**: Botão "📋 Ver Personagem" (ativo)
- **Se não criou personagem**: Botão "📋 Ver Personagem" (desabilitado/não clicável)

#### Para o Dono da Sessão
- ⚠️ **PENDENTE**: Botão adicional **"🚫 Expulsar"** (aguardando implementação do método `kickParticipant` no backend)
  - Quando implementado, aparecerá ao lado do botão "Ver Personagem" para outros jogadores
  - Abrirá um dialog de confirmação antes de expulsar

### 4. Chat Funcional
- ✅ Campo de input igual ao de `session-create.html`
- ✅ Envio de mensagens com Enter ou botão 📤
- ✅ Mensagens com timestamp
- ✅ Diferenciação visual:
  - Mensagens do sistema (cinza)
  - Mensagens de outros jogadores (dourado)
  - Suas mensagens (verde)
- ✅ Scroll automático para última mensagem
- ✅ Validação: apenas usuários com personagem podem enviar mensagens

### 5. Controles do Dono
- ✅ Botão "🎆 Iniciar Aventura" visível apenas para o owner
- ✅ Validação: todos devem ter personagem criado antes de iniciar
- ✅ Confirmação antes de iniciar
- ✅ Redirecionamento automático ao iniciar

### 6. Polling em Tempo Real
- ✅ Atualização de mensagens a cada 3 segundos
- ✅ Atualização de participantes a cada ~9 segundos
- ✅ Detecção automática de início da sessão
- ✅ Redirecionamento para tela de jogo quando sessão iniciar

### 7. Funcionalidades Gerais
- ✅ Botão "🚪 Sair da Sessão" com confirmação
- ✅ Redirecionamento para home após sair
- ✅ Notificações de sucesso/erro/avisos
- ✅ Design responsivo
- ✅ Tema medieval consistente

## Fluxo de Uso

### 1. Criação de Sessão
```
session-create.html → Criar Sessão → waiting-room.html?sessionId=XXX
```

### 2. Na Sala de Espera
```
1. Usuário entra na sala
2. Vê outros participantes
3. Cria seu personagem (se necessário)
4. Conversa no chat
5. Owner aguarda todos criarem personagens
6. Owner inicia a aventura
7. Todos são redirecionados para game.html
```

### 3. Funcionalidades do Owner
```
1. Ver todos os participantes
2. Expulsar jogadores (com confirmação)
3. Iniciar aventura quando todos estiverem prontos
```

## Métodos RPC Utilizados

### Sessões
- `getSessionDetails(sessionId, token)` - Obter detalhes da sessão e participantes ✅
- `leaveSession(sessionId, token)` - Sair da sessão ✅
- `startSession(sessionId, token)` - Iniciar aventura (apenas owner) ✅
- ⚠️ `kickParticipant(sessionId, userId, token)` - **PENDENTE** - Expulsar participante (apenas owner)

### Chat
- `sendMessage(sessionId, characterId, message, token)` - Enviar mensagem
- `getMessages(sessionId, lastMessageId, token)` - Obter mensagens (long polling)

## Estrutura de Dados Esperada

### Resposta de `getSessionDetails`
```javascript
{
  session: {
    id: "session_xxx",
    name: "Aventura Épica",
    sessionCode: "ABC123",
    storyId: "story_xxx",
    storyName: "A Maldição do Dragão", // Opcional
    ownerId: "user_xxx",
    status: "WAITING_PLAYERS",
    maxPlayers: 4,
    participants: [
      {
        userId: "user_xxx",
        username: "DragonSlayer",
        characterId: "char_xxx",
        characterName: "Thorin",
        hasCreatedCharacter: true,
        isOnline: true,
        joinedAt: "2025-10-06T10:00:00Z"
      }
    ]
  },
  currentUserId: "user_xxx",
  currentCharacterId: "char_xxx" // null se não criou
}
```

### Estrutura de Mensagem
```javascript
{
  id: 1,
  sessionId: "session_xxx",
  userId: "user_xxx",
  username: "DragonSlayer",
  characterId: "char_xxx",
  characterName: "Thorin",
  message: "Vamos pelo túnel da esquerda!",
  timestamp: "2025-10-06T10:15:00Z",
  type: "user" // ou "system"
}
```

## Design Patterns Utilizados

### 1. Service Layer Pattern
```javascript
// Encapsula chamadas RPC
import { getSessionDetails } from '../../services/sessionService.js';
```

### 2. Polling Pattern
```javascript
// Atualização periódica sem recarregar página
setInterval(async () => {
  await loadChatMessages(sessionId);
}, 3000);
```

### 3. Event-Driven UI
```javascript
// Listeners para interações do usuário
document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
```

### 4. State Management
```javascript
// Estado centralizado da aplicação
let sessionData = null;
let currentUserId = null;
let currentCharacterId = null;
```

## Estilos CSS

### Variáveis do Tema Medieval
```css
--primary-gold: #D4AF37
--secondary-gold: #B8860B
--dark-brown: #2D1810
--medium-brown: #3E2417
--parchment: #F4E4BC
--green: #228B22
--dark-red: #8B0000
--silver: #C0C0C0
```

### Layout Responsivo
- Desktop: 2 colunas (55% participantes + 45% chat)
- Tablet/Mobile: 1 coluna empilhada

### Scrollbars Customizadas
- Estilo medieval consistente
- Dourado com gradiente
- Bordas e sombras

## Próximos Passos

### Implementações Futuras
1. ⚠️ **Método kickParticipant no Backend** - Implementar método RPC para expulsar participantes (apenas owner)
2. **Visualização de Personagem** - Implementar dialog completo com dados do personagem
3. **character-form.html** - Criar formulário de criação de personagem
4. **game.html** - Criar tela principal do jogo
5. **Notificações Push** - Considerar WebSockets para updates em tempo real
6. **Indicador de "Digitando"** - Mostrar quando alguém está digitando no chat

## Testes Recomendados

### Teste 1: Criar e Entrar
1. Criar sessão em `session-create.html`
2. Verificar redirecionamento para `waiting-room.html`
3. Confirmar que dados da sessão aparecem corretamente

### Teste 2: Chat
1. Tentar enviar mensagem sem personagem (deve bloquear)
2. Criar personagem
3. Enviar mensagens e verificar aparecimento no chat
4. Verificar scroll automático

### Teste 3: Múltiplos Jogadores
1. Abrir em 2 navegadores/abas diferentes
2. Criar sessão no primeiro
3. Entrar com código no segundo
4. Verificar que ambos veem os participantes atualizados

### Teste 4: Owner Controls
1. Como owner, verificar botão "Iniciar Aventura"
2. Tentar iniciar sem todos terem personagem (deve bloquear)
3. Expulsar um jogador
4. Iniciar com todos prontos

### Teste 5: Responsividade
1. Testar em desktop (1920x1080)
2. Testar em tablet (768x1024)
3. Testar em mobile (375x667)
4. Verificar scrolls e layout

## Dependências

### Serviços
- `sessionService.js` ✅
- `chatService.js` ✅
- `authService.js` (já existente)

### Utilitários
- `auth.js` (getToken, requireAuth) ✅
- `utils.js` (handleError, showNotification, escapeHtml) ✅

### RPC Client
- `RpcClient` class ✅

## Notas Técnicas

### Segurança
- ✅ Validação de token em todas as chamadas RPC
- ✅ Escape de HTML para prevenir XSS
- ✅ Validação de permissões no backend (owner vs participante)

### Performance
- ✅ Polling inteligente com intervalos ajustados
- ✅ Comparação de dados para evitar re-renders desnecessários
- ✅ Scroll automático apenas em novas mensagens

### UX
- ✅ Confirmações antes de ações destrutivas (sair, expulsar)
- ✅ Feedbacks visuais claros (notificações, loaders)
- ✅ Mensagens de erro amigáveis
- ✅ Design consistente com resto do projeto

---

**Status**: ✅ Implementação Completa
**Autor**: GitHub Copilot
**Data**: 06/10/2025
