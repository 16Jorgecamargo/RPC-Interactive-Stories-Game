# 13b. Cronograma de Desenvolvimento - Frontend

Este cronograma contém **apenas cards de frontend** (cliente, UI, integração com API). Orientado a entregas, sem datas específicas.

**Nota**: Frontend depende de endpoints backend estarem disponíveis. Veja dependências de cada card.

---

## FASE 1: Setup do Cliente

### Sprint 1.1: Estrutura Básica do Cliente
**Objetivo**: Configurar ambiente frontend

#### Cards
- [x] **FE-SETUP-001**: Criar repositório ou pasta separado para cliente
- [x] **FE-SETUP-002**: Inicializar projeto com `npm init`
- [x] **FE-SETUP-003**: Criar estrutura de pastas (`src/`, `public/`, `styles/`)
- [x] **FE-SETUP-004**: Instalar Express para servir arquivos estáticos
- [x] **FE-SETUP-005**: Criar `server.js` que serve `public/index.html`
- [x] **FE-SETUP-006**: Configurar scripts npm (`start`, `dev`)
- [x] **FE-SETUP-007**: Criar `.env` com `VITE_SERVER_URL=http://173.249.60.72:8443`

**Critério de Aceite**: `npm start` abre browser em `localhost:5173`

---

### Sprint 1.2: Cliente RPC HTTP
**Objetivo**: Comunicação com backend via fetch

#### Cards
- [ ] **FE-RPC-001**: Criar `src/rpc/client.js` com classe RPC Client
- [ ] **FE-RPC-002**: Implementar método `call(method, params)` usando fetch
  - **Depende de**: `BE-SERVER-001`
- [ ] **FE-RPC-003**: Adicionar tratamento de erros JSON-RPC
- [ ] **FE-RPC-004**: Implementar retry automático em caso de falha de rede
- [ ] **FE-RPC-005**: Adicionar timeout de 10s nas requisições
- [ ] **FE-RPC-006**: Testar chamada para `/health` endpoint
  - **Depende de**: `BE-SERVER-006`

**Critério de Aceite**: Cliente consegue fazer chamadas RPC para backend

---

## FASE 2: Autenticação (Frontend)

### Sprint 2.1: Tela de Login
**Objetivo**: Interface de autenticação

#### Cards
- [ ] **FE-AUTH-001**: Criar `public/login.html` com formulário de login
- [ ] **FE-AUTH-002**: Criar `src/ui/auth/login.js` com lógica de login
- [ ] **FE-AUTH-003**: Implementar `login(username, password)` chamando backend
  - **Depende de**: `BE-AUTH-006`, `FE-RPC-002`
- [ ] **FE-AUTH-004**: Salvar JWT token em `localStorage` após login
  - **Depende de**: `FE-AUTH-003`
- [ ] **FE-AUTH-005**: Redirecionar para dashboard após login bem-sucedido
- [ ] **FE-AUTH-006**: Exibir mensagens de erro (credenciais inválidas)
- [ ] **FE-AUTH-007**: Adicionar validação de campos vazios

**Critério de Aceite**: Usuário faz login e é redirecionado para dashboard

---

### Sprint 2.2: Tela de Registro
**Objetivo**: Cadastro de novos usuários

#### Cards
- [ ] **FE-AUTH-008**: Criar `public/register.html` com formulário de registro
- [ ] **FE-AUTH-009**: Criar `src/ui/auth/register.js` com lógica de registro
- [ ] **FE-AUTH-010**: Implementar `register(username, password, confirmPassword)`
  - **Depende de**: `BE-AUTH-005`, `FE-RPC-002`
- [ ] **FE-AUTH-011**: Validar que senhas coincidem no frontend
- [ ] **FE-AUTH-012**: Validar força de senha (mínimo 6 caracteres)
- [ ] **FE-AUTH-013**: Exibir mensagens de erro (usuário já existe)
- [ ] **FE-AUTH-014**: Redirecionar para login após registro bem-sucedido

**Critério de Aceite**: Usuário consegue se registrar e fazer login

---

### Sprint 2.3: Proteção de Rotas
**Objetivo**: Verificar autenticação em todas as páginas

#### Cards
- [ ] **FE-AUTH-015**: Criar `src/utils/auth.js` com funções auxiliares
- [ ] **FE-AUTH-016**: Implementar `getToken()` para ler do localStorage
- [ ] **FE-AUTH-017**: Implementar `isAuthenticated()` para verificar token
- [ ] **FE-AUTH-018**: Implementar `requireAuth()` para redirecionar se não logado
- [ ] **FE-AUTH-019**: Adicionar `requireAuth()` em todas as páginas protegidas
- [ ] **FE-AUTH-020**: Implementar botão de logout que limpa localStorage
- [ ] **FE-AUTH-021**: Testar fluxo completo de autenticação

**Critério de Aceite**: Páginas protegidas redirecionam para login se não autenticado

---

## FASE 3: Usuários e Personagens (Frontend)

### Sprint 3.1: Dashboard do Usuário
**Objetivo**: Tela inicial após login

#### Cards
- [ ] **FE-USER-001**: Criar `public/dashboard.html` com layout básico
- [ ] **FE-USER-002**: Criar `src/ui/dashboard.js` com lógica do dashboard
- [ ] **FE-USER-003**: Implementar `getDashboard()` chamando backend
  - **Depende de**: `BE-USER-002`, `FE-AUTH-016`
- [ ] **FE-USER-004**: Exibir nome do usuário logado no header
- [ ] **FE-USER-005**: Mostrar botões: "Criar Sessão", "Entrar em Sessão", "Meus Personagens"
- [ ] **FE-USER-006**: Listar sessões ativas do usuário (se houver)
  - **Depende de**: `BE-SESSION-006`
- [ ] **FE-USER-007**: Adicionar menu de navegação (Dashboard, Personagens, Sessões, Logout)

**Critério de Aceite**: Dashboard exibe informações do usuário e opções de navegação

---

### Sprint 3.2: Listagem de Personagens
**Objetivo**: Ver personagens criados

#### Cards
- [ ] **FE-CHAR-001**: Criar `public/characters.html` com lista de personagens
- [ ] **FE-CHAR-002**: Criar `src/ui/characters/list.js` com lógica de listagem
- [ ] **FE-CHAR-003**: Implementar `getMyCharacters()` chamando backend
  - **Depende de**: `BE-CHAR-005`, `FE-AUTH-016`
- [ ] **FE-CHAR-004**: Exibir cards com nome, raça, classe de cada personagem
- [ ] **FE-CHAR-005**: Adicionar botão "Criar Novo Personagem"
- [ ] **FE-CHAR-006**: Adicionar botões "Editar" e "Excluir" em cada card
- [ ] **FE-CHAR-007**: Implementar confirmação antes de excluir personagem

**Critério de Aceite**: Usuário visualiza lista de personagens com opções de gerenciamento

---

### Sprint 3.3: Criação de Personagem
**Objetivo**: Formulário para criar personagem D&D

#### Cards
- [ ] **FE-CHAR-008**: Criar `public/character-create.html` com formulário completo
- [ ] **FE-CHAR-009**: Criar `src/ui/characters/create.js` com lógica de criação
- [ ] **FE-CHAR-010**: Implementar `getCharacterOptions()` para popular dropdowns
  - **Depende de**: `BE-CHAR-012`, `FE-RPC-002`
- [ ] **FE-CHAR-011**: Criar dropdowns para Raça e Classe
- [ ] **FE-CHAR-012**: Criar campos para atributos (Força, Destreza, etc.)
- [ ] **FE-CHAR-013**: Adicionar validação: atributos entre 3-18
- [ ] **FE-CHAR-014**: Criar campos de texto para background, aparência, personalidade, medos, objetivos
- [ ] **FE-CHAR-015**: Criar lista de equipamentos (adicionar/remover itens)
- [ ] **FE-CHAR-016**: Implementar `createCharacter()` chamando backend
  - **Depende de**: `BE-CHAR-004`, `FE-AUTH-016`
- [ ] **FE-CHAR-017**: Redirecionar para lista de personagens após criação
- [ ] **FE-CHAR-018**: Adicionar preview visual dos atributos (barra de progresso)

**Critério de Aceite**: Usuário cria personagem D&D completo com validações

---

### Sprint 3.4: Edição de Personagem
**Objetivo**: Atualizar personagens existentes

#### Cards
- [ ] **FE-CHAR-019**: Criar `public/character-edit.html` (reutilizar form de criação)
- [ ] **FE-CHAR-020**: Criar `src/ui/characters/edit.js` com lógica de edição
- [ ] **FE-CHAR-021**: Implementar `getCharacter(id)` para carregar dados
  - **Depende de**: `BE-CHAR-006`, `FE-AUTH-016`
- [ ] **FE-CHAR-022**: Preencher formulário com dados existentes
- [ ] **FE-CHAR-023**: Implementar `updateCharacter(id, data)` chamando backend
  - **Depende de**: `BE-CHAR-007`, `FE-AUTH-016`
- [ ] **FE-CHAR-024**: Redirecionar para lista após atualização bem-sucedida

**Critério de Aceite**: Usuário edita personagem existente

---

## FASE 4: Sessões (Frontend)

### Sprint 4.1: Criação de Sessão
**Objetivo**: Criar nova sessão de jogo

#### Cards
- [ ] **FE-SESSION-001**: Criar `public/session-create.html` com formulário
- [ ] **FE-SESSION-002**: Criar `src/ui/sessions/create.js` com lógica de criação
- [ ] **FE-SESSION-003**: Implementar `getStoryCatalog()` para listar histórias disponíveis
  - **Depende de**: `BE-STORY-015`, `FE-AUTH-016`
- [ ] **FE-SESSION-004**: Criar dropdown para selecionar história
- [ ] **FE-SESSION-005**: Adicionar campo para nome da sessão
- [ ] **FE-SESSION-006**: Adicionar campo para número máximo de jogadores
- [ ] **FE-SESSION-007**: Implementar `createSession(data)` chamando backend
  - **Depende de**: `BE-SESSION-003`, `FE-AUTH-016`
- [ ] **FE-SESSION-008**: Exibir código da sessão após criação
  - **Depende de**: `BE-SESSION-004`
- [ ] **FE-SESSION-009**: Redirecionar para sala de espera após criação

**Critério de Aceite**: Usuário cria sessão, recebe código, e entra na sala de espera

---

### Sprint 4.2: Entrar em Sessão
**Objetivo**: Entrar em sessão via código

#### Cards
- [ ] **FE-SESSION-010**: Criar `public/session-join.html` com campo de código
- [ ] **FE-SESSION-011**: Criar `src/ui/sessions/join.js` com lógica de entrada
- [ ] **FE-SESSION-012**: Implementar `joinSession(code)` chamando backend
  - **Depende de**: `BE-SESSION-005`, `FE-AUTH-016`
- [ ] **FE-SESSION-013**: Validar formato do código (6 caracteres alfanuméricos)
- [ ] **FE-SESSION-014**: Exibir erro se código inválido ou sessão cheia
- [ ] **FE-SESSION-015**: Redirecionar para sala de espera após entrada bem-sucedida

**Critério de Aceite**: Usuário entra em sessão via código

---

### Sprint 4.3: Sala de Espera
**Objetivo**: Visualizar participantes e aguardar início

#### Cards
- [ ] **FE-SESSION-016**: Criar `public/waiting-room.html` com layout da sala
- [ ] **FE-SESSION-017**: Criar `src/ui/sessions/waitingRoom.js` com lógica da sala
- [ ] **FE-SESSION-018**: Implementar `getWaitingRoomState(sessionId)` chamando backend
  - **Depende de**: `BE-SESSION-007`, `FE-AUTH-016`
- [ ] **FE-SESSION-019**: Exibir código da sessão (para compartilhar)
- [ ] **FE-SESSION-020**: Listar participantes com status (criou personagem ou não)
- [ ] **FE-SESSION-021**: Exibir botão "Criar Personagem" se usuário não tem personagem
- [ ] **FE-SESSION-022**: Redirecionar para criação de personagem ao clicar no botão
- [ ] **FE-SESSION-023**: Polling de atualizações para detectar novos participantes
  - **Depende de**: `BE-POLL-003`, `FE-RPC-002`
- [ ] **FE-SESSION-024**: Exibir botão "Iniciar Jogo" (apenas para owner)
- [ ] **FE-SESSION-025**: Desabilitar botão "Iniciar" até todos criarem personagens
  - **Depende de**: `BE-SESSION-016`
- [ ] **FE-SESSION-026**: Implementar `startGame(sessionId)` chamando backend
  - **Depende de**: `BE-SESSION-017`, `FE-AUTH-016`
- [ ] **FE-SESSION-027**: Redirecionar para tela de jogo ao iniciar

**Critério de Aceite**: Sala de espera atualiza em tempo real e permite iniciar jogo quando todos prontos

---

### Sprint 4.4: Listagem de Sessões
**Objetivo**: Ver minhas sessões ativas

#### Cards
- [ ] **FE-SESSION-028**: Criar `public/sessions.html` com lista de sessões
- [ ] **FE-SESSION-029**: Criar `src/ui/sessions/list.js` com lógica de listagem
- [ ] **FE-SESSION-030**: Implementar `getMySessions()` chamando backend
  - **Depende de**: `BE-SESSION-006`, `FE-AUTH-016`
- [ ] **FE-SESSION-031**: Exibir cards com nome, história, status, jogadores
- [ ] **FE-SESSION-032**: Adicionar badges de status (WAITING, CREATING, IN_PROGRESS, COMPLETED)
- [ ] **FE-SESSION-033**: Adicionar botão "Entrar" para reconectar em sessão ativa
- [ ] **FE-SESSION-034**: Adicionar botão "Excluir" (apenas para owner)
  - **Depende de**: `BE-SESSION-008`

**Critério de Aceite**: Usuário visualiza e gerencia suas sessões

---

## FASE 5: Gameplay (Frontend)

### Sprint 5.1: Tela de Jogo - Estrutura
**Objetivo**: Layout principal do jogo

#### Cards
- [ ] **FE-GAME-001**: Criar `public/game.html` com layout de 3 colunas
- [ ] **FE-GAME-002**: Criar `src/ui/game/gameScreen.js` com lógica principal
- [ ] **FE-GAME-003**: Coluna esquerda: Timeline da narrativa
- [ ] **FE-GAME-004**: Coluna central: Capítulo atual + opções de votação
- [ ] **FE-GAME-005**: Coluna direita: Chat + tiles de jogadores
- [ ] **FE-GAME-006**: Implementar header com nome da sessão e botão "Sair"

**Critério de Aceite**: Layout da tela de jogo estruturado

---

### Sprint 5.2: Exibição de Capítulo
**Objetivo**: Mostrar narrativa e opções

#### Cards
- [ ] **FE-GAME-007**: Criar componente de capítulo com texto formatado
- [ ] **FE-GAME-008**: Implementar `getGameState(sessionId)` chamando backend
  - **Depende de**: `BE-GAME-001`, `FE-AUTH-016`
- [ ] **FE-GAME-009**: Exibir texto do capítulo atual
- [ ] **FE-GAME-010**: Listar opções de votação como botões/cards
- [ ] **FE-GAME-011**: Destacar opção votada pelo jogador
- [ ] **FE-GAME-012**: Mostrar contador de votos por opção (total)
- [ ] **FE-GAME-013**: Exibir barra de progresso (votos recebidos / total jogadores)

**Critério de Aceite**: Jogador vê capítulo e opções de votação

---

### Sprint 5.3: Sistema de Votação
**Objetivo**: Votar e ver resultados

#### Cards
- [ ] **FE-GAME-014**: Implementar `vote(sessionId, characterId, optionId)` chamando backend
  - **Depende de**: `BE-VOTE-002`, `FE-AUTH-016`
- [ ] **FE-GAME-015**: Desabilitar botões de votação após votar
- [ ] **FE-GAME-016**: Exibir feedback visual ao votar (animação, cor)
- [ ] **FE-GAME-017**: Implementar `getVotes(sessionId)` para atualizar contadores
  - **Depende de**: `BE-VOTE-004`
- [ ] **FE-GAME-018**: Atualizar contadores em tempo real via polling
  - **Depende de**: `BE-POLL-003`, `FE-GAME-017`
- [ ] **FE-GAME-019**: Exibir mensagem quando todos votaram
- [ ] **FE-GAME-020**: Avançar automaticamente para próximo capítulo
  - **Depende de**: `BE-VOTE-008`

**Critério de Aceite**: Jogador vota, vê contadores atualizarem, e avança para próximo capítulo

---

### Sprint 5.4: Timer de Votação
**Objetivo**: Mostrar contagem regressiva

#### Cards
- [ ] **FE-GAME-021**: Criar componente de timer visual (círculo ou barra)
- [ ] **FE-GAME-022**: Implementar `getVotingTimer(sessionId)` chamando backend
  - **Depende de**: `BE-VOTE-012`, `FE-AUTH-016`
- [ ] **FE-GAME-023**: Exibir tempo restante formatado (MM:SS)
- [ ] **FE-GAME-024**: Atualizar timer a cada segundo via polling
  - **Depende de**: `FE-GAME-022`, `BE-POLL-003`
- [ ] **FE-GAME-025**: Exibir aviso quando faltarem 30 segundos
- [ ] **FE-GAME-026**: Mostrar mensagem "Tempo esgotado!" quando timer expirar
- [ ] **FE-GAME-027**: Desabilitar votação automaticamente após timeout

**Critério de Aceite**: Timer exibe contagem regressiva e finaliza votação automaticamente

---

### Sprint 5.5: Timeline da Narrativa
**Objetivo**: Histórico de capítulos visitados

#### Cards
- [ ] **FE-GAME-028**: Criar componente de timeline vertical
- [ ] **FE-GAME-029**: Implementar `getTimeline(sessionId)` chamando backend
  - **Depende de**: `BE-GAME-006`, `FE-AUTH-016`
- [ ] **FE-GAME-030**: Exibir lista de capítulos visitados (do mais recente ao mais antigo)
- [ ] **FE-GAME-031**: Destacar capítulo atual
- [ ] **FE-GAME-032**: Mostrar escolha feita em cada capítulo anterior
- [ ] **FE-GAME-033**: Adicionar scroll automático para capítulo mais recente
- [ ] **FE-GAME-034**: Exibir timestamps relativos ("há 5 minutos")

**Critério de Aceite**: Timeline mostra histórico de capítulos e decisões

---

### Sprint 5.6: Tiles de Jogadores
**Objetivo**: Status de cada participante

#### Cards
- [ ] **FE-GAME-035**: Criar componente de tile de jogador (card pequeno)
- [ ] **FE-GAME-036**: Implementar `getPlayerTiles(sessionId)` chamando backend
  - **Depende de**: `BE-GAME-001`, `FE-AUTH-016`
- [ ] **FE-GAME-037**: Exibir nome do personagem + raça/classe
- [ ] **FE-GAME-038**: Adicionar badge "Votou" ou "Aguardando voto"
- [ ] **FE-GAME-039**: Adicionar indicador de status online/offline
  - **Depende de**: `BE-POLL-011`
- [ ] **FE-GAME-040**: Implementar clique no tile para ver ficha completa
- [ ] **FE-GAME-041**: Atualizar tiles em tempo real via polling
  - **Depende de**: `BE-POLL-003`

**Critério de Aceite**: Tiles mostram status de cada jogador em tempo real

---

## FASE 6: Chat (Frontend)

### Sprint 6.1: Interface de Chat
**Objetivo**: Chat funcional na tela de jogo

#### Cards
- [ ] **FE-CHAT-001**: Criar componente de chat (lista + input)
- [ ] **FE-CHAT-002**: Criar `src/ui/chat/chat.js` com lógica do chat
- [ ] **FE-CHAT-003**: Implementar `getChatMessages(sessionId)` chamando backend
  - **Depende de**: `BE-CHAT-004`, `FE-AUTH-016`
- [ ] **FE-CHAT-004**: Exibir lista de mensagens com scroll automático
- [ ] **FE-CHAT-005**: Destacar mensagens do próprio jogador
- [ ] **FE-CHAT-006**: Adicionar timestamps nas mensagens
- [ ] **FE-CHAT-007**: Diferenciar visualmente mensagens SYSTEM e PLAYER
- [ ] **FE-CHAT-008**: Implementar input de texto com validação (max 500 chars)
- [ ] **FE-CHAT-009**: Implementar `sendMessage(sessionId, characterId, message)` chamando backend
  - **Depende de**: `BE-CHAT-003`, `FE-AUTH-016`
- [ ] **FE-CHAT-010**: Limpar input após enviar mensagem
- [ ] **FE-CHAT-011**: Adicionar suporte para Enter para enviar (Shift+Enter para nova linha)
- [ ] **FE-CHAT-012**: Implementar polling para receber novas mensagens
  - **Depende de**: `BE-POLL-006`, `FE-RPC-002`
- [ ] **FE-CHAT-013**: Adicionar notificação sonora para novas mensagens

**Critério de Aceite**: Chat funcional com mensagens em tempo real

---

## FASE 7: Sistema de Combate (Frontend)

### Sprint 7.1: Detecção e Entrada em Combate
**Objetivo**: Transição para modo de combate

#### Cards
- [ ] **FE-COMBAT-001**: Detectar evento `COMBAT_STARTED` via polling
  - **Depende de**: `BE-COMBAT-003`, `BE-POLL-003`
- [ ] **FE-COMBAT-002**: Exibir modal "Combate Iniciado!"
- [ ] **FE-COMBAT-003**: Criar `public/combat.html` com layout de combate
- [ ] **FE-COMBAT-004**: Redirecionar para tela de combate
- [ ] **FE-COMBAT-005**: Implementar `getCombatState(sessionId)` chamando backend
  - **Depende de**: `BE-COMBAT-020`, `FE-AUTH-016`

**Critério de Aceite**: Jogadores entram automaticamente em modo de combate

---

### Sprint 7.2: Rolagem de Iniciativa
**Objetivo**: Determinar ordem de combate

#### Cards
- [ ] **FE-COMBAT-006**: Criar componente de rolagem de D20 (animação)
- [ ] **FE-COMBAT-007**: Implementar `rollInitiative(sessionId, characterId)` chamando backend
  - **Depende de**: `BE-COMBAT-005`, `FE-AUTH-016`
- [ ] **FE-COMBAT-008**: Exibir botão "Rolar Iniciativa"
- [ ] **FE-COMBAT-009**: Animar rolagem de dado (D20 girando)
- [ ] **FE-COMBAT-010**: Exibir resultado da rolagem + modificadores
- [ ] **FE-COMBAT-011**: Desabilitar botão após rolar
- [ ] **FE-COMBAT-012**: Exibir ordem de iniciativa (lista de participantes + inimigos)
  - **Depende de**: `FE-COMBAT-005`

**Critério de Aceite**: Jogadores rolam iniciativa e veem ordem de combate

---

### Sprint 7.3: Interface de Turno
**Objetivo**: Executar ações no turno

#### Cards
- [ ] **FE-COMBAT-013**: Criar componente de painel de turno
- [ ] **FE-COMBAT-014**: Implementar `getCurrentTurn(sessionId)` chamando backend
  - **Depende de**: `BE-COMBAT-009`, `FE-AUTH-016`
- [ ] **FE-COMBAT-015**: Destacar personagem no turno atual
- [ ] **FE-COMBAT-016**: Exibir timer de turno (contagem regressiva)
- [ ] **FE-COMBAT-017**: Listar alvos disponíveis (inimigos vivos)
- [ ] **FE-COMBAT-018**: Implementar seleção de alvo (clique no inimigo)
- [ ] **FE-COMBAT-019**: Exibir botão "Atacar" após selecionar alvo
- [ ] **FE-COMBAT-020**: Desabilitar ações se não é o turno do jogador

**Critério de Aceite**: Jogador vê seu turno e pode selecionar alvo

---

### Sprint 7.4: Ataque e Dano
**Objetivo**: Executar ataques

#### Cards
- [ ] **FE-COMBAT-021**: Implementar `attack(sessionId, attackerId, targetId)` chamando backend
  - **Depende de**: `BE-COMBAT-010`, `FE-AUTH-016`
- [ ] **FE-COMBAT-022**: Animar rolagem de D20 para ataque
- [ ] **FE-COMBAT-023**: Exibir resultado do ataque (MISS, HIT, CRITICAL_HIT)
- [ ] **FE-COMBAT-024**: Animar rolagem de dado de dano (se acerto)
- [ ] **FE-COMBAT-025**: Exibir dano causado
- [ ] **FE-COMBAT-026**: Atualizar HP do alvo (barra de vida)
  - **Depende de**: `BE-COMBAT-013`
- [ ] **FE-COMBAT-027**: Exibir animação de morte se HP ≤ 0
- [ ] **FE-COMBAT-028**: Mostrar log de combate (histórico de ações)

**Critério de Aceite**: Jogador ataca, vê resultados, e HP atualiza

---

### Sprint 7.5: Ressurreição
**Objetivo**: Tentar reviver personagens mortos

#### Cards
- [ ] **FE-COMBAT-029**: Detectar quando personagem morre
  - **Depende de**: `BE-COMBAT-014`
- [ ] **FE-COMBAT-030**: Exibir modal "Você morreu! Tentar reviver?"
- [ ] **FE-COMBAT-031**: Implementar `revive(sessionId, characterId)` chamando backend
  - **Depende de**: `BE-COMBAT-016`, `FE-AUTH-016`
- [ ] **FE-COMBAT-032**: Animar rolagem de 2d10
- [ ] **FE-COMBAT-033**: Exibir resultado (sucesso se soma ≥ 11)
- [ ] **FE-COMBAT-034**: Mostrar tentativas restantes (3 máximo)
- [ ] **FE-COMBAT-035**: Exibir "Morte Permanente" se falhar 3 vezes
  - **Depende de**: `BE-COMBAT-019`

**Critério de Aceite**: Personagem morto pode tentar ressurreição com 2d10

---

## FASE 8: Painel Admin (Frontend)

### Sprint 8.1: Dashboard Admin
**Objetivo**: Painel administrativo

#### Cards
- [ ] **FE-ADMIN-001**: Criar `public/admin/dashboard.html` (admin only)
- [ ] **FE-ADMIN-002**: Verificar role admin antes de renderizar
  - **Depende de**: `FE-AUTH-015`
- [ ] **FE-ADMIN-003**: Implementar `getAdminStats()` chamando backend
  - **Depende de**: `BE-ADMIN-012`, `FE-AUTH-016`
- [ ] **FE-ADMIN-004**: Exibir cards com estatísticas (total users, sessões, etc.)
- [ ] **FE-ADMIN-005**: Criar menu de navegação (Users, Sessões, Histórias)

**Critério de Aceite**: Admin acessa painel com estatísticas

---

### Sprint 8.2: Gerenciamento de Usuários
**Objetivo**: CRUD de usuários (admin)

#### Cards
- [ ] **FE-ADMIN-006**: Criar `public/admin/users.html` com lista de usuários
- [ ] **FE-ADMIN-007**: Implementar `getAllUsers()` chamando backend
  - **Depende de**: `BE-ADMIN-001`, `FE-AUTH-016`
- [ ] **FE-ADMIN-008**: Exibir tabela com username, role, stats, ações
- [ ] **FE-ADMIN-009**: Adicionar botão "Promover para Admin"
  - **Depende de**: `BE-ADMIN-005`
- [ ] **FE-ADMIN-010**: Adicionar botão "Rebaixar para User"
  - **Depende de**: `BE-ADMIN-006`
- [ ] **FE-ADMIN-011**: Adicionar botão "Excluir" com confirmação
  - **Depende de**: `BE-ADMIN-003`, `BE-ADMIN-004`
- [ ] **FE-ADMIN-012**: Exibir modal de confirmação com cascade info

**Critério de Aceite**: Admin gerencia usuários (promover, rebaixar, excluir)

---

### Sprint 8.3: Gerenciamento de Histórias
**Objetivo**: Upload e gerenciamento de histórias

#### Cards
- [ ] **FE-ADMIN-013**: Criar `public/admin/stories.html` com lista de histórias
- [ ] **FE-ADMIN-014**: Implementar `getAllStories()` chamando backend
  - **Depende de**: `BE-STORY-014`, `FE-AUTH-016`
- [ ] **FE-ADMIN-015**: Exibir tabela com título, gênero, status, ações
- [ ] **FE-ADMIN-016**: Criar formulário de upload de arquivo `.mmd`
- [ ] **FE-ADMIN-017**: Implementar `uploadMermaidFile(file, metadata)` chamando backend
  - **Depende de**: `BE-STORY-013`, `FE-AUTH-016`
- [ ] **FE-ADMIN-018**: Adicionar botão "Ativar/Desativar"
  - **Depende de**: `BE-STORY-018`
- [ ] **FE-ADMIN-019**: Adicionar botão "Ver Estatísticas"
  - **Depende de**: `BE-ADMIN-015`
- [ ] **FE-ADMIN-020**: Adicionar botão "Excluir"
  - **Depende de**: `BE-STORY-017`

**Critério de Aceite**: Admin gerencia histórias (upload, ativar/desativar, excluir)

---

## FASE 9: Polish e UX (Frontend)

### Sprint 9.1: Estilos e Responsividade
**Objetivo**: Melhorar visual e adaptabilidade

#### Cards
- [ ] **FE-STYLE-001**: Criar `src/styles/main.css` com reset e variáveis CSS
- [ ] **FE-STYLE-002**: Definir paleta de cores do sistema
- [ ] **FE-STYLE-003**: Criar componentes reutilizáveis (botões, cards, inputs)
- [ ] **FE-STYLE-004**: Adicionar responsividade (mobile, tablet, desktop)
- [ ] **FE-STYLE-005**: Implementar dark mode (opcional)
- [ ] **FE-STYLE-006**: Adicionar animações de transição
- [ ] **FE-STYLE-007**: Testar em diferentes navegadores (Chrome, Firefox, Safari)

**Critério de Aceite**: Interface visualmente polida e responsiva

---

### Sprint 9.2: Loading States e Feedback
**Objetivo**: Indicadores visuais de carregamento

#### Cards
- [ ] **FE-UX-001**: Criar componente de spinner/loading
- [ ] **FE-UX-002**: Adicionar loading em todas as chamadas RPC
- [ ] **FE-UX-003**: Criar componente de toast/notification
- [ ] **FE-UX-004**: Exibir toasts para sucesso/erro de ações
- [ ] **FE-UX-005**: Adicionar skeleton screens para listas
- [ ] **FE-UX-006**: Implementar debounce em inputs de busca
- [ ] **FE-UX-007**: Adicionar confirmações visuais (checkmark animado)

**Critério de Aceite**: Usuário sempre vê feedback visual das ações

---

### Sprint 9.3: Tratamento de Erros
**Objetivo**: Mensagens de erro amigáveis

#### Cards
- [ ] **FE-ERROR-001**: Criar componente de error boundary
- [ ] **FE-ERROR-002**: Mapear códigos de erro backend para mensagens amigáveis
- [ ] **FE-ERROR-003**: Exibir página 404 para rotas inexistentes
- [ ] **FE-ERROR-004**: Exibir página de erro genérico (500)
- [ ] **FE-ERROR-005**: Adicionar retry automático em caso de erro de rede
- [ ] **FE-ERROR-006**: Exibir mensagem "Servidor offline" se backend não responder
- [ ] **FE-ERROR-007**: Implementar logging de erros (console ou serviço externo)

**Critério de Aceite**: Erros são tratados com mensagens claras e ações de recuperação

---

## FASE 10: Build e Distribuição (Frontend)

### Sprint 10.1: Preparação para Distribuição
**Objetivo**: Empacotar cliente para distribuição

#### Cards
- [ ] **FE-BUILD-001**: Criar README com instruções de instalação
- [ ] **FE-BUILD-002**: Criar INSTALL.md com guia passo-a-passo ilustrado
- [ ] **FE-BUILD-003**: Adicionar screenshots das principais telas
- [ ] **FE-BUILD-004**: Configurar variável `VITE_SERVER_URL` para VPS
- [ ] **FE-BUILD-005**: Testar instalação completa (`npm install && npm start`)
- [ ] **FE-BUILD-006**: Criar script `build.sh` para gerar release
- [ ] **FE-BUILD-007**: Gerar arquivo ZIP com código do cliente
- [ ] **FE-BUILD-008**: Publicar release no GitHub com instruções

**Critério de Aceite**: Usuários baixam ZIP, instalam, e jogam sem problemas

---

## Resumo de Cards Frontend

### Total de Cards por Fase
- **FASE 1 (Setup)**: 13 cards
- **FASE 2 (Autenticação)**: 21 cards
- **FASE 3 (Usuários/Personagens)**: 31 cards
- **FASE 4 (Sessões)**: 34 cards
- **FASE 5 (Gameplay)**: 41 cards
- **FASE 6 (Chat)**: 13 cards
- **FASE 7 (Combate)**: 35 cards
- **FASE 8 (Admin)**: 20 cards
- **FASE 9 (Polish)**: 21 cards
- **FASE 10 (Build)**: 8 cards

**TOTAL: ~237 cards frontend**

### Priorização
- **P0 (Bloqueantes)**: ~20 cards (FASE 1-2)
- **P1 (Críticos)**: ~80 cards (FASE 3-5)
- **P2 (Importantes)**: ~60 cards (FASE 6, 9-10)
- **P3 (Extras)**: ~77 cards (funcionalidades avançadas)

---

## Principais Dependências Backend → Frontend

### Cards Frontend que dependem de Backend:
- `FE-RPC-002` → `BE-SERVER-001`
- `FE-AUTH-003` → `BE-AUTH-006`
- `FE-AUTH-010` → `BE-AUTH-005`
- `FE-CHAR-003` → `BE-CHAR-005`
- `FE-CHAR-010` → `BE-CHAR-012`
- `FE-CHAR-016` → `BE-CHAR-004`
- `FE-SESSION-003` → `BE-STORY-015`
- `FE-SESSION-007` → `BE-SESSION-003`
- `FE-SESSION-012` → `BE-SESSION-005`
- `FE-SESSION-018` → `BE-SESSION-007`
- `FE-GAME-008` → `BE-GAME-001`
- `FE-GAME-014` → `BE-VOTE-002`
- `FE-GAME-022` → `BE-VOTE-012`
- `FE-CHAT-003` → `BE-CHAT-004`
- `FE-CHAT-009` → `BE-CHAT-003`
- `FE-COMBAT-005` → `BE-COMBAT-020`
- `FE-COMBAT-007` → `BE-COMBAT-005`
- `FE-COMBAT-021` → `BE-COMBAT-010`
- `FE-COMBAT-031` → `BE-COMBAT-016`
- `FE-ADMIN-003` → `BE-ADMIN-012`

**Regra Geral**: Frontend só pode implementar funcionalidade quando endpoint backend correspondente estiver pronto.

---

[← Voltar ao Cronograma Principal](./13-cronograma.md) | [Backend →](./13-cronograma-backend.md)