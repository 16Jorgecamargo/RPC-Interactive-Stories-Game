# 13a. Cronograma de Desenvolvimento - Backend

Este cronograma contém **apenas cards de backend** (servidor, API, lógica de negócio). Orientado a entregas, sem datas específicas.

---

## FASE 1: Fundação do Backend

### Sprint 1.1: Setup Inicial do Servidor
**Objetivo**: Preparar ambiente e estrutura base do servidor

#### Cards
- [ ] **BE-SETUP-001**: Inicializar novo repositorio ou pasta para o servidor com `.gitignore` e README
- [ ] **BE-SETUP-002**: Configurar TypeScript (`tsconfig.json`, tipos base)
- [ ] **BE-SETUP-003**: Instalar dependências core (Fastify, Zod, JWT, bcrypt)
- [ ] **BE-SETUP-004**: Criar estrutura de pastas (`src/`, `stories/`, etc.)
- [ ] **BE-SETUP-005**: Configurar ESLint/Prettier
- [ ] **BE-SETUP-006**: Configurar scripts npm (`dev`, `build`, `start`)

**Critério de Aceite**: `npm run dev` executa servidor básico na porta 8443

---

### Sprint 1.2: Servidor Fastify + Swagger
**Objetivo**: Servidor HTTP com autodocumentação funcional

#### Cards
- [ ] **BE-SERVER-001**: Criar `src/rpc/server.ts` com Fastify básico
- [ ] **BE-SERVER-002**: Configurar `fastify-type-provider-zod`
- [ ] **BE-SERVER-003**: Configurar `@fastify/swagger` para OpenAPI
- [ ] **BE-SERVER-004**: Configurar `@fastify/swagger-ui` em `/docs`
- [ ] **BE-SERVER-005**: Implementar middleware CORS para clientes remotos
- [ ] **BE-SERVER-006**: Criar rota `/health` para health checks
- [ ] **BE-SERVER-007**: Testar Swagger UI em `localhost:8443/docs`

**Critério de Aceite**: Swagger UI acessível e exibindo rota `/health`

---

### Sprint 1.3: Autenticação JWT
**Objetivo**: Sistema de autenticação completo

#### Cards
- [ ] **BE-AUTH-001**: Criar schemas Zod para `RegisterSchema` e `LoginSchema`
- [ ] **BE-AUTH-002**: Implementar `src/utils/jwt.ts` (sign/verify)
- [ ] **BE-AUTH-003**: Implementar `src/utils/bcrypt.ts` (hash/compare)
- [ ] **BE-AUTH-004**: Criar `src/stores/userStore.ts` (persistência JSON)
- [ ] **BE-AUTH-005**: Implementar `POST /rpc/register` com validação Zod
- [ ] **BE-AUTH-006**: Implementar `POST /rpc/login` retornando JWT
- [ ] **BE-AUTH-007**: Criar middleware `src/rpc/middleware/auth.ts` para validar tokens
- [ ] **BE-AUTH-008**: Adicionar `401 Unauthorized` para rotas protegidas
- [ ] **BE-AUTH-009**: Testar fluxo completo no Swagger UI

**Critério de Aceite**: Usuário consegue registrar, fazer login, e acessar rota protegida com token

---

## FASE 2: Usuários e Personagens (Backend)

### Sprint 2.1: CRUD de Usuários
**Objetivo**: Gerenciamento completo de usuários

#### Cards
- [ ] **BE-USER-001**: Criar `UserSchema` com validações Zod
- [ ] **BE-USER-002**: Implementar `GET /rpc/users/me` (dados do usuário logado)
  - **Depende de**: `BE-AUTH-007`
- [ ] **BE-USER-003**: Implementar `PATCH /rpc/users/me` (atualizar perfil)
  - **Depende de**: `BE-USER-002`
- [ ] **BE-USER-004**: Implementar `POST /rpc/users/change-password`
  - **Depende de**: `BE-AUTH-003`
- [ ] **BE-USER-005**: Adicionar campo `role: USER | ADMIN` no schema
- [ ] **BE-USER-006**: Criar middleware `requireAdmin` para rotas admin
  - **Depende de**: `BE-USER-005`
- [ ] **BE-USER-007**: Testar todos os endpoints no Swagger UI

**Critério de Aceite**: Usuário consegue visualizar e editar seu perfil

---

### Sprint 2.2: Sistema de Personagens D&D
**Objetivo**: Criação e gerenciamento de personagens

#### Cards
- [ ] **BE-CHAR-001**: Criar `CharacterSchema` com atributos D&D
- [ ] **BE-CHAR-002**: Criar `src/models/characterSchemas.ts` com validações
- [ ] **BE-CHAR-003**: Implementar `src/stores/characterStore.ts`
- [ ] **BE-CHAR-004**: Implementar `POST /rpc/characters` (criar personagem)
  - **Depende de**: `BE-CHAR-001`, `BE-CHAR-003`
- [ ] **BE-CHAR-005**: Implementar `GET /rpc/characters` (listar meus personagens)
  - **Depende de**: `BE-CHAR-003`, `BE-AUTH-007`
- [ ] **BE-CHAR-006**: Implementar `GET /rpc/characters/:id` (detalhes)
  - **Depende de**: `BE-CHAR-003`
- [ ] **BE-CHAR-007**: Implementar `PATCH /rpc/characters/:id` (atualizar)
  - **Depende de**: `BE-CHAR-006`
- [ ] **BE-CHAR-008**: Implementar `DELETE /rpc/characters/:id` (excluir)
  - **Depende de**: `BE-CHAR-006`
- [ ] **BE-CHAR-009**: Validar vinculação `userId` (usuário só edita seus próprios)
  - **Depende de**: `BE-CHAR-004`
- [ ] **BE-CHAR-010**: Adicionar validação de atributos (soma entre 3-18)
  - **Depende de**: `BE-CHAR-001`

**Critério de Aceite**: Usuário consegue criar, editar e excluir personagens D&D

---

### Sprint 2.3: Opções de Raças e Classes
**Objetivo**: Dados mestres para criação de personagens

#### Cards
- [ ] **BE-CHAR-011**: Criar `RaceSchema` e `ClassSchema`
- [ ] **BE-CHAR-012**: Implementar `GET /rpc/character-options` (raças + classes)
  - **Depende de**: `BE-CHAR-011`
- [ ] **BE-CHAR-013**: Popular dados base (Humano, Elfo, Anão, Halfling)
- [ ] **BE-CHAR-014**: Popular classes (Guerreiro, Mago, Ladino, Clérigo)
- [ ] **BE-CHAR-015**: Adicionar descrições e traits nas opções
- [ ] **BE-CHAR-016**: Validar que raça/classe escolhidas existem no sistema
  - **Depende de**: `BE-CHAR-012`, `BE-CHAR-013`, `BE-CHAR-014`

**Critério de Aceite**: Frontend recebe lista de raças e classes para dropdowns

---

## FASE 3: Histórias e Sessões (Backend)

### Sprint 3.1: Parser de Mermaid
**Objetivo**: Converter Mermaid em estrutura de capítulos

#### Cards
- [ ] **BE-STORY-001**: Criar `src/services/mermaidParser.ts`
- [ ] **BE-STORY-002**: Implementar parse de nós texto (`["texto"]`)
  - **Depende de**: `BE-STORY-001`
- [ ] **BE-STORY-003**: Implementar parse de nós decisão (`{decisão?}`)
  - **Depende de**: `BE-STORY-002`
- [ ] **BE-STORY-004**: Implementar parse de arestas com labels (`-->|label|`)
  - **Depende de**: `BE-STORY-003`
- [ ] **BE-STORY-005**: Gerar mapa `capitulos: Map<id, {texto, opcoes}>`
  - **Depende de**: `BE-STORY-004`
- [ ] **BE-STORY-006**: Adicionar validação de grafo (sem ciclos infinitos)
  - **Depende de**: `BE-STORY-005`
- [ ] **BE-STORY-007**: Testar com arquivo `stories/caverna-misteriosa.mmd`
  - **Depende de**: `BE-STORY-006`
- [ ] **BE-STORY-008**: Detectar nós de combate (`[COMBATE]`)
  - **Depende de**: `BE-STORY-005`

**Critério de Aceite**: Parser converte arquivo `.mmd` em JSON navegável

---

### Sprint 3.2: CRUD de Histórias (Admin)
**Objetivo**: Gerenciamento de histórias por admins

#### Cards
- [ ] **BE-STORY-009**: Criar `StorySchema` com metadados
- [ ] **BE-STORY-010**: Criar `StoryMetadataSchema` (gênero, dificuldade, etc.)
- [ ] **BE-STORY-011**: Implementar `src/stores/storyStore.ts`
- [ ] **BE-STORY-012**: Implementar `POST /rpc/stories` (criar história, admin only)
  - **Depende de**: `BE-STORY-001`, `BE-STORY-011`, `BE-USER-006`
- [ ] **BE-STORY-013**: Implementar `POST /rpc/stories/upload-mermaid` (upload arquivo)
  - **Depende de**: `BE-STORY-012`
- [ ] **BE-STORY-014**: Implementar `GET /rpc/stories` (listar todas, admin)
  - **Depende de**: `BE-STORY-011`, `BE-USER-006`
- [ ] **BE-STORY-015**: Implementar `GET /rpc/stories/catalog` (catálogo público)
  - **Depende de**: `BE-STORY-011`
- [ ] **BE-STORY-016**: Implementar `PATCH /rpc/stories/:id` (atualizar)
  - **Depende de**: `BE-STORY-012`
- [ ] **BE-STORY-017**: Implementar `DELETE /rpc/stories/:id` (excluir)
  - **Depende de**: `BE-STORY-012`
- [ ] **BE-STORY-018**: Adicionar campo `isActive` para ativar/desativar histórias
  - **Depende de**: `BE-STORY-009`

**Critério de Aceite**: Admin consegue criar, editar e gerenciar histórias

---

### Sprint 3.3: CRUD de Sessões
**Objetivo**: Criação e gerenciamento de sessões de jogo

#### Cards
- [ ] **BE-SESSION-001**: Criar `SessionSchema` com estados (WAITING_PLAYERS, etc.)
- [ ] **BE-SESSION-002**: Implementar `src/stores/sessionStore.ts`
- [ ] **BE-SESSION-003**: Implementar `POST /rpc/sessions` (criar sessão)
  - **Depende de**: `BE-SESSION-001`, `BE-SESSION-002`, `BE-STORY-015`
- [ ] **BE-SESSION-004**: Gerar `sessionCode` de 6 caracteres alfanuméricos
  - **Depende de**: `BE-SESSION-003`
- [ ] **BE-SESSION-005**: Implementar `POST /rpc/sessions/join` (entrar via código)
  - **Depende de**: `BE-SESSION-004`
- [ ] **BE-SESSION-006**: Implementar `GET /rpc/sessions` (listar minhas sessões)
  - **Depende de**: `BE-SESSION-002`, `BE-AUTH-007`
- [ ] **BE-SESSION-007**: Implementar `GET /rpc/sessions/:id` (detalhes)
  - **Depende de**: `BE-SESSION-002`
- [ ] **BE-SESSION-008**: Implementar `DELETE /rpc/sessions/:id` (excluir, owner only)
  - **Depende de**: `BE-SESSION-007`
- [ ] **BE-SESSION-009**: Implementar `POST /rpc/sessions/:id/leave` (sair da sessão)
  - **Depende de**: `BE-SESSION-007`
- [ ] **BE-SESSION-010**: Validar limite de `maxPlayers`
  - **Depende de**: `BE-SESSION-003`, `BE-SESSION-005`

**Critério de Aceite**: Usuário consegue criar sessão e outros podem entrar via código

---

### Sprint 3.4: Estados de Sessão
**Objetivo**: Máquina de estados da sessão

#### Cards
- [ ] **BE-SESSION-011**: Implementar transição `WAITING_PLAYERS → CREATING_CHARACTERS`
  - **Depende de**: `BE-SESSION-001`
- [ ] **BE-SESSION-012**: Implementar transição `CREATING_CHARACTERS → IN_PROGRESS`
  - **Depende de**: `BE-SESSION-011`
- [ ] **BE-SESSION-013**: Implementar transição `IN_PROGRESS → COMPLETED`
  - **Depende de**: `BE-SESSION-012`
- [ ] **BE-SESSION-014**: Validar que todos têm personagens antes de iniciar
  - **Depende de**: `BE-CHAR-004`, `BE-SESSION-011`
- [ ] **BE-SESSION-015**: Implementar `isLocked` para bloquear entrada em `IN_PROGRESS`
  - **Depende de**: `BE-SESSION-012`
- [ ] **BE-SESSION-016**: Implementar `GET /rpc/sessions/:id/can-start` (validação)
  - **Depende de**: `BE-SESSION-014`
- [ ] **BE-SESSION-017**: Implementar `POST /rpc/sessions/:id/start` (iniciar jogo)
  - **Depende de**: `BE-SESSION-016`

**Critério de Aceite**: Sessão só inicia quando todos os participantes criaram personagens

---

## FASE 4: Gameplay Core (Backend)

### Sprint 4.1: Navegação de Capítulos
**Objetivo**: Exibir e navegar pela história

#### Cards
- [ ] **BE-GAME-001**: Implementar `GET /rpc/game/:sessionId/state` (capítulo atual)
  - **Depende de**: `BE-SESSION-017`, `BE-STORY-005`
- [ ] **BE-GAME-002**: Retornar `{capitulo: {texto, opcoes}, participants, votos}`
  - **Depende de**: `BE-GAME-001`
- [ ] **BE-GAME-003**: Implementar lógica de avanço para próximo capítulo
  - **Depende de**: `BE-GAME-002`
- [ ] **BE-GAME-004**: Detectar capítulos finais (sem opções)
  - **Depende de**: `BE-GAME-003`
- [ ] **BE-GAME-005**: Marcar sessão como `COMPLETED` ao chegar no fim
  - **Depende de**: `BE-GAME-004`, `BE-SESSION-013`
- [ ] **BE-GAME-006**: Implementar `GET /rpc/game/:sessionId/timeline` (histórico)
  - **Depende de**: `BE-GAME-003`

**Critério de Aceite**: Jogadores veem capítulo atual e opções disponíveis

---

### Sprint 4.2: Sistema de Votação
**Objetivo**: Votação colaborativa para decisões

#### Cards
- [ ] **BE-VOTE-001**: Criar `VoteSchema` vinculando `characterId + opcaoId`
- [ ] **BE-VOTE-002**: Implementar `POST /rpc/game/:sessionId/vote` (registrar voto)
  - **Depende de**: `BE-VOTE-001`, `BE-GAME-001`
- [ ] **BE-VOTE-003**: Armazenar votos em `session.votes: Map<characterId, opcaoId>`
  - **Depende de**: `BE-VOTE-002`
- [ ] **BE-VOTE-004**: Implementar `GET /rpc/game/:sessionId/votes` (status votação)
  - **Depende de**: `BE-VOTE-003`
- [ ] **BE-VOTE-005**: Calcular vencedor por maioria simples
  - **Depende de**: `BE-VOTE-004`
- [ ] **BE-VOTE-006**: Detectar quando todos votaram (finalizar automático)
  - **Depende de**: `BE-VOTE-005`
- [ ] **BE-VOTE-007**: Implementar tratamento de empates (revote ou random)
  - **Depende de**: `BE-VOTE-005`
- [ ] **BE-VOTE-008**: Avançar para próximo capítulo após resolução
  - **Depende de**: `BE-VOTE-006`, `BE-GAME-003`

**Critério de Aceite**: Jogadores votam e sistema avança automaticamente quando todos votaram

---

### Sprint 4.3: Timer de Votação
**Objetivo**: Timeout automático para votações

#### Cards
- [ ] **BE-VOTE-009**: Adicionar `votingTimer` na sessão
  - **Depende de**: `BE-SESSION-001`
- [ ] **BE-VOTE-010**: Implementar `POST /rpc/game/:sessionId/vote-timeout` (configurar)
  - **Depende de**: `BE-VOTE-009`
- [ ] **BE-VOTE-011**: Iniciar timer quando primeiro jogador vota
  - **Depende de**: `BE-VOTE-002`, `BE-VOTE-010`
- [ ] **BE-VOTE-012**: Implementar `GET /rpc/game/:sessionId/vote-timer` (tempo restante)
  - **Depende de**: `BE-VOTE-011`
- [ ] **BE-VOTE-013**: Finalizar votação automaticamente após timeout
  - **Depende de**: `BE-VOTE-011`, `BE-VOTE-005`
- [ ] **BE-VOTE-014**: Implementar `POST /rpc/game/:sessionId/extend-timer` (estender)
  - **Depende de**: `BE-VOTE-012`
- [ ] **BE-VOTE-015**: Notificar jogadores quando timer expira
  - **Depende de**: `BE-VOTE-013`

**Critério de Aceite**: Votação finaliza automaticamente após X minutos se nem todos votaram

---

### Sprint 4.4: Resolução de Empates
**Objetivo**: Estratégias para resolver empates em votações

#### Cards
- [ ] **BE-VOTE-016**: Implementar estratégia `REVOTE` (nova votação com opções empatadas)
  - **Depende de**: `BE-VOTE-007`
- [ ] **BE-VOTE-017**: Implementar estratégia `RANDOM` (sortear opção aleatória)
  - **Depende de**: `BE-VOTE-007`
- [ ] **BE-VOTE-018**: Implementar estratégia `MASTER_DECIDES` (owner escolhe)
  - **Depende de**: `BE-VOTE-007`
- [ ] **BE-VOTE-019**: Implementar `POST /rpc/game/:sessionId/resolve-tie`
  - **Depende de**: `BE-VOTE-016`, `BE-VOTE-017`, `BE-VOTE-018`
- [ ] **BE-VOTE-020**: Adicionar configuração de estratégia na criação da sessão
  - **Depende de**: `BE-SESSION-003`

**Critério de Aceite**: Sistema resolve empates conforme estratégia configurada

---

## FASE 5: Chat e Real-time (Backend)

### Sprint 5.1: Chat via RPC
**Objetivo**: Sistema de chat em tempo real

#### Cards
- [ ] **BE-CHAT-001**: Criar `MessageSchema` com `characterId`, `message`, `timestamp`
- [ ] **BE-CHAT-002**: Implementar `src/stores/messageStore.ts`
- [ ] **BE-CHAT-003**: Implementar `POST /rpc/chat/:sessionId/send` (enviar mensagem)
  - **Depende de**: `BE-CHAT-001`, `BE-CHAT-002`
- [ ] **BE-CHAT-004**: Implementar `GET /rpc/chat/:sessionId/messages` (histórico)
  - **Depende de**: `BE-CHAT-002`
- [ ] **BE-CHAT-005**: Sanitizar mensagens (evitar XSS)
  - **Depende de**: `BE-CHAT-003`
- [ ] **BE-CHAT-006**: Limitar tamanho de mensagens (500 caracteres)
  - **Depende de**: `BE-CHAT-001`
- [ ] **BE-CHAT-007**: Adicionar tipos de mensagem (PLAYER, SYSTEM, VOTING_UPDATE)
  - **Depende de**: `BE-CHAT-001`

**Critério de Aceite**: Jogadores enviam e recebem mensagens no chat

---

### Sprint 5.2: Long Polling para Atualizações
**Objetivo**: Updates em tempo real sem WebSockets

#### Cards
- [ ] **BE-POLL-001**: Criar `UpdateSchema` com tipos de eventos
- [ ] **BE-POLL-002**: Implementar `src/stores/eventStore.ts` (fila de eventos)
- [ ] **BE-POLL-003**: Implementar `GET /rpc/updates/:sessionId?since=lastId` (polling)
  - **Depende de**: `BE-POLL-001`, `BE-POLL-002`
- [ ] **BE-POLL-004**: Retornar eventos desde `lastUpdateId`
  - **Depende de**: `BE-POLL-003`
- [ ] **BE-POLL-005**: Implementar eventos: `PLAYER_JOINED`, `CHARACTER_CREATED`, etc.
  - **Depende de**: `BE-POLL-001`
- [ ] **BE-POLL-006**: Implementar `GET /rpc/chat/:sessionId/messages?since=lastId`
  - **Depende de**: `BE-CHAT-004`, `BE-POLL-003`
- [ ] **BE-POLL-007**: Limpar eventos antigos (>24h) periodicamente
  - **Depende de**: `BE-POLL-002`

**Critério de Aceite**: Cliente recebe atualizações em tempo real via polling

---

### Sprint 5.3: Status de Conexão
**Objetivo**: Heartbeat para saber quem está online

#### Cards
- [ ] **BE-POLL-008**: Adicionar campo `lastActivity` nos participantes
  - **Depende de**: `BE-SESSION-001`
- [ ] **BE-POLL-009**: Implementar `POST /rpc/sessions/:sessionId/heartbeat`
  - **Depende de**: `BE-POLL-008`
- [ ] **BE-POLL-010**: Atualizar `lastActivity` a cada heartbeat
  - **Depende de**: `BE-POLL-009`
- [ ] **BE-POLL-011**: Marcar `isOnline: false` se sem heartbeat >5min
  - **Depende de**: `BE-POLL-010`
- [ ] **BE-POLL-012**: Notificar quando jogador desconecta/reconecta
  - **Depende de**: `BE-POLL-011`, `BE-POLL-005`

**Critério de Aceite**: Sistema identifica jogadores online/offline

---

## FASE 6: Sistema de Combate (Backend)

### Sprint 6.1: Detecção de Combate
**Objetivo**: Identificar nós de combate em histórias

#### Cards
- [ ] **BE-COMBAT-001**: Estender parser Mermaid para detectar `[COMBATE]`
  - **Depende de**: `BE-STORY-008`
- [ ] **BE-COMBAT-002**: Criar `CombatStateSchema` com iniciativa
- [ ] **BE-COMBAT-003**: Implementar `POST /rpc/combat/:sessionId/initiate`
  - **Depende de**: `BE-COMBAT-001`, `BE-COMBAT-002`
- [ ] **BE-COMBAT-004**: Gerar inimigos baseado em metadados do nó
  - **Depende de**: `BE-COMBAT-003`

**Critério de Aceite**: Parser detecta nós de combate e inicia combate

---

### Sprint 6.2: Iniciativa e Turnos
**Objetivo**: Ordem de combate

#### Cards
- [ ] **BE-COMBAT-005**: Implementar `POST /rpc/combat/:sessionId/roll-initiative`
  - **Depende de**: `BE-COMBAT-003`, `BE-CHAR-001`
- [ ] **BE-COMBAT-006**: Rolar D20 + modificadores de Destreza
  - **Depende de**: `BE-COMBAT-005`
- [ ] **BE-COMBAT-007**: Ordenar participantes por iniciativa
  - **Depende de**: `BE-COMBAT-006`
- [ ] **BE-COMBAT-008**: Implementar sistema de turnos com timer
  - **Depende de**: `BE-COMBAT-007`
- [ ] **BE-COMBAT-009**: Implementar `GET /rpc/combat/:sessionId/current-turn`
  - **Depende de**: `BE-COMBAT-008`

**Critério de Aceite**: Combate segue ordem de iniciativa

---

### Sprint 6.3: Ataques e Dano
**Objetivo**: Mecânica de ataque D&D

#### Cards
- [ ] **BE-COMBAT-010**: Implementar `POST /rpc/combat/:sessionId/attack`
  - **Depende de**: `BE-COMBAT-009`
- [ ] **BE-COMBAT-011**: Rolar D20 vs Armor Class (acerto/erro)
  - **Depende de**: `BE-COMBAT-010`
- [ ] **BE-COMBAT-012**: Rolar dado de dano em caso de acerto
  - **Depende de**: `BE-COMBAT-011`
- [ ] **BE-COMBAT-013**: Aplicar dano ao HP do alvo
  - **Depende de**: `BE-COMBAT-012`
- [ ] **BE-COMBAT-014**: Detectar morte (HP ≤ 0)
  - **Depende de**: `BE-COMBAT-013`
- [ ] **BE-COMBAT-015**: Implementar crítico (natural 20) com dano dobrado
  - **Depende de**: `BE-COMBAT-011`

**Critério de Aceite**: Jogadores atacam inimigos e causam dano

---

### Sprint 6.4: Morte e Ressurreição
**Objetivo**: Mecânica de revival

#### Cards
- [ ] **BE-COMBAT-016**: Implementar `POST /rpc/combat/:sessionId/revive`
  - **Depende de**: `BE-COMBAT-014`
- [ ] **BE-COMBAT-017**: Rolar 2d10, sucesso se soma ≥ 11
  - **Depende de**: `BE-COMBAT-016`
- [ ] **BE-COMBAT-018**: Limitar a 3 tentativas de ressurreição
  - **Depende de**: `BE-COMBAT-017`
- [ ] **BE-COMBAT-019**: Marcar personagem como `PERMANENTLY_DEAD` após 3 falhas
  - **Depende de**: `BE-COMBAT-018`
- [ ] **BE-COMBAT-020**: Implementar `GET /rpc/combat/:sessionId/state`
  - **Depende de**: `BE-COMBAT-002`

**Critério de Aceite**: Personagens podem ser revividos com 2d10

---

## FASE 7: Painel Administrativo (Backend)

### Sprint 7.1: Gerenciamento de Usuários
**Objetivo**: Visualizar e administrar usuários

#### Cards
- [ ] **BE-ADMIN-001**: Implementar `GET /rpc/admin/users` (listar todos, admin only)
  - **Depende de**: `BE-USER-006`
- [ ] **BE-ADMIN-002**: Adicionar estatísticas (total sessões, personagens)
  - **Depende de**: `BE-ADMIN-001`
- [ ] **BE-ADMIN-003**: Implementar `DELETE /rpc/admin/users/:id` (excluir usuário)
  - **Depende de**: `BE-ADMIN-001`
- [ ] **BE-ADMIN-004**: Confirmar exclusão com dialog (cascade info)
  - **Depende de**: `BE-ADMIN-003`
- [ ] **BE-ADMIN-005**: Implementar `POST /rpc/admin/users/:id/promote` (tornar admin)
  - **Depende de**: `BE-ADMIN-001`
- [ ] **BE-ADMIN-006**: Implementar `POST /rpc/admin/users/:id/demote` (remover admin)
  - **Depende de**: `BE-ADMIN-001`

**Critério de Aceite**: Admin visualiza e gerencia todos os usuários

---

### Sprint 7.2: Gerenciamento de Sessões
**Objetivo**: Visualizar e administrar sessões

#### Cards
- [ ] **BE-ADMIN-007**: Implementar `GET /rpc/admin/sessions` (listar todas)
  - **Depende de**: `BE-USER-006`
- [ ] **BE-ADMIN-008**: Adicionar filtros (status, owner, história)
  - **Depende de**: `BE-ADMIN-007`
- [ ] **BE-ADMIN-009**: Implementar `GET /rpc/admin/sessions/:id` (detalhes completos)
  - **Depende de**: `BE-ADMIN-007`
- [ ] **BE-ADMIN-010**: Implementar `DELETE /rpc/admin/sessions/:id` (excluir sessão)
  - **Depende de**: `BE-ADMIN-009`
- [ ] **BE-ADMIN-011**: Implementar `POST /rpc/admin/sessions/:id/force-state` (forçar estado)
  - **Depende de**: `BE-ADMIN-009`, `BE-SESSION-011`

**Critério de Aceite**: Admin visualiza e gerencia todas as sessões

---

### Sprint 7.3: Estatísticas do Sistema
**Objetivo**: Dashboard com métricas

#### Cards
- [ ] **BE-ADMIN-012**: Implementar `GET /rpc/admin/stats` (estatísticas gerais)
  - **Depende de**: `BE-USER-006`
- [ ] **BE-ADMIN-013**: Calcular: total usuários, sessões ativas, histórias
  - **Depende de**: `BE-ADMIN-012`
- [ ] **BE-ADMIN-014**: Calcular: uptime, total game hours, avg players/session
  - **Depende de**: `BE-ADMIN-012`
- [ ] **BE-ADMIN-015**: Implementar `GET /rpc/admin/stories/:id/usage` (estatísticas de história)
  - **Depende de**: `BE-ADMIN-012`
- [ ] **BE-ADMIN-016**: Mostrar escolhas mais populares por capítulo
  - **Depende de**: `BE-ADMIN-015`

**Critério de Aceite**: Admin visualiza estatísticas do sistema

---

## FASE 8: Documentação e Testes (Backend)

### Sprint 8.1: Documentação Swagger
**Objetivo**: Docs 100% completas em `/docs`

#### Cards
- [ ] **BE-DOC-001**: Revisar todos os schemas Zod com `.describe()`
- [ ] **BE-DOC-002**: Adicionar exemplos em responses (`.openapi({ example })`)
- [ ] **BE-DOC-003**: Adicionar `tags` em todas as rotas
- [ ] **BE-DOC-004**: Adicionar `summary` e `description` detalhadas
- [ ] **BE-DOC-005**: Configurar `securitySchemes` para JWT
  - **Depende de**: `BE-AUTH-006`
- [ ] **BE-DOC-006**: Testar todos os endpoints no Swagger UI
- [ ] **BE-DOC-007**: Adicionar README com instruções de uso da API

**Critério de Aceite**: Swagger UI exibe docs completas e testáveis

---

### Sprint 8.2: Testes Automatizados
**Objetivo**: Cobertura de testes

#### Cards
- [ ] **BE-TEST-001**: Configurar Vitest para testes unitários
- [ ] **BE-TEST-002**: Escrever testes para schemas Zod (validações)
- [ ] **BE-TEST-003**: Escrever testes para utils (JWT, bcrypt)
  - **Depende de**: `BE-AUTH-002`, `BE-AUTH-003`
- [ ] **BE-TEST-004**: Escrever testes para parser Mermaid
  - **Depende de**: `BE-STORY-007`
- [ ] **BE-TEST-005**: Escrever testes de integração para rotas (auth, users)
  - **Depende de**: `BE-AUTH-009`, `BE-USER-007`
- [ ] **BE-TEST-006**: Escrever testes de integração para gameplay (vote, chat)
  - **Depende de**: `BE-VOTE-008`, `BE-CHAT-007`
- [ ] **BE-TEST-007**: Configurar CI/CD com GitHub Actions (opcional)
- [ ] **BE-TEST-008**: Alcançar >70% de cobertura de código

**Critério de Aceite**: Testes passam com boa cobertura

---

### Sprint 8.3: Otimizações e Refatoração
**Objetivo**: Melhorar performance e qualidade do código

#### Cards
- [ ] **BE-OPT-001**: Implementar cache para histórias (evitar re-parse)
  - **Depende de**: `BE-STORY-007`
- [ ] **BE-OPT-002**: Adicionar índices nos stores (busca rápida por ID)
- [ ] **BE-OPT-003**: Otimizar polling (evitar loops vazios)
  - **Depende de**: `BE-POLL-003`
- [ ] **BE-OPT-004**: Refatorar código duplicado (DRY)
- [ ] **BE-OPT-005**: Adicionar logging estruturado (Winston ou Pino)
- [ ] **BE-OPT-006**: Implementar rate limiting (evitar spam)
- [ ] **BE-OPT-007**: Adicionar validação de tamanho de payload

**Critério de Aceite**: Sistema roda de forma estável e performática

---

## FASE 9: Deploy e Infraestrutura (Backend)

### Sprint 9.1: Docker
**Objetivo**: Containerização do servidor

#### Cards
- [ ] **BE-DEPLOY-001**: Criar `Dockerfile` para servidor
- [ ] **BE-DEPLOY-002**: Criar `docker-compose.yml` para orquestração
- [ ] **BE-DEPLOY-003**: Configurar volumes para persistência (`data/`, `logs/`)
- [ ] **BE-DEPLOY-004**: Adicionar health check no Docker
  - **Depende de**: `BE-SERVER-006`
- [ ] **BE-DEPLOY-005**: Testar build e execução local com Docker
- [ ] **BE-DEPLOY-006**: Criar `.dockerignore`

**Critério de Aceite**: Servidor executa em container Docker

---

### Sprint 9.2: Deploy VPS
**Objetivo**: Servidor rodando 24/7 na VPS

#### Cards
- [ ] **BE-DEPLOY-007**: Configurar VPS (SSH, firewall, Docker)
- [ ] **BE-DEPLOY-008**: Fazer upload do código para VPS
- [ ] **BE-DEPLOY-009**: Executar `docker-compose up -d` na VPS
  - **Depende de**: `BE-DEPLOY-002`
- [ ] **BE-DEPLOY-010**: Configurar variáveis de ambiente (`.env.production`)
- [ ] **BE-DEPLOY-011**: Configurar restart automático (`restart: unless-stopped`)
- [ ] **BE-DEPLOY-012**: Testar acesso remoto em `http://173.249.60.72:8443`
- [ ] **BE-DEPLOY-013**: Configurar HTTPS com Let's Encrypt

**Critério de Aceite**: Servidor acessível publicamente e rodando 24/7

---

## Resumo de Cards Backend

### Total de Cards por Fase
- **FASE 1 (Fundação)**: 22 cards
- **FASE 2 (Usuários/Personagens)**: 23 cards
- **FASE 3 (Histórias/Sessões)**: 36 cards
- **FASE 4 (Gameplay)**: 26 cards
- **FASE 5 (Chat/Real-time)**: 19 cards
- **FASE 6 (Combate)**: 20 cards
- **FASE 7 (Admin)**: 16 cards
- **FASE 8 (Docs/Testes)**: 21 cards
- **FASE 9 (Deploy)**: 13 cards

**TOTAL: ~196 cards backend**

### Priorização
- **P0 (Bloqueantes)**: ~25 cards (FASE 1-2)
- **P1 (Críticos)**: ~70 cards (FASE 3-4)
- **P2 (Importantes)**: ~55 cards (FASE 5, 7-8)
- **P3 (Extras)**: ~46 cards (otimizações avançadas)

---

[← Voltar ao Cronograma Principal](./13-cronograma.md) | [Frontend →](./13-cronograma-frontend.md)