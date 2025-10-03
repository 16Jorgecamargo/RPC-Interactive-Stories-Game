# 13a. Cronograma de Desenvolvimento - Backend

Este cronograma contém **apenas cards de backend** (servidor, API, lógica de negócio). Orientado a entregas, sem datas específicas.

---

## FASE 1: Fundação do Backend

### Sprint 1.1: Setup Inicial do Servidor
**Objetivo**: Preparar ambiente e estrutura base do servidor

#### Cards
- [x] **BE-SETUP-001**: Inicializar novo repositorio ou pasta para o servidor com `.gitignore` e README
- [x] **BE-SETUP-002**: Configurar TypeScript (`tsconfig.json`, tipos base)
- [x] **BE-SETUP-003**: Instalar dependências core (Fastify, Zod, JWT, bcrypt)
- [x] **BE-SETUP-004**: Criar estrutura de pastas (`src/`, `stories/`, etc.)
- [x] **BE-SETUP-005**: Configurar ESLint/Prettier
- [x] **BE-SETUP-006**: Configurar scripts npm (`dev`, `build`, `start`)

**Critério de Aceite**: `npm run dev` executa servidor básico na porta 8443 ✅

---

### Sprint 1.2: Servidor Fastify + Swagger
**Objetivo**: Servidor HTTP com autodocumentação funcional

#### Cards
- [x] **BE-SERVER-001**: Criar `src/rpc/server.ts` com Fastify básico
- [x] **BE-SERVER-002**: Configurar `fastify-type-provider-zod`
- [x] **BE-SERVER-003**: Configurar `@fastify/swagger` para OpenAPI
- [x] **BE-SERVER-004**: Configurar `@fastify/swagger-ui` em `/docs`
- [x] **BE-SERVER-005**: Implementar middleware CORS para clientes remotos
- [x] **BE-SERVER-006**: Criar rota `/health` para health checks
- [x] **BE-SERVER-007**: Testar Swagger UI em `localhost:8443/docs`

**Critério de Aceite**: Swagger UI acessível e exibindo rota `/health` ✅

---

### Sprint 1.3: Autenticação JWT
**Objetivo**: Sistema de autenticação completo

#### Cards
- [x] **BE-AUTH-001**: Criar schemas Zod para `RegisterSchema` e `LoginSchema`
- [x] **BE-AUTH-002**: Implementar `src/utils/jwt.ts` (sign/verify)
- [x] **BE-AUTH-003**: Implementar `src/utils/bcrypt.ts` (hash/compare)
- [x] **BE-AUTH-004**: Criar `src/stores/userStore.ts` (persistência JSON)
- [x] **BE-AUTH-005**: Implementar `POST /rpc/register` com validação Zod
- [x] **BE-AUTH-006**: Implementar `POST /rpc/login` retornando JWT
- [x] **BE-AUTH-007**: Criar middleware `src/rpc/middleware/auth.ts` para validar tokens
- [x] **BE-AUTH-008**: Adicionar `401 Unauthorized` para rotas protegidas
- [x] **BE-AUTH-009**: Testar fluxo completo no Swagger UI

**Critério de Aceite**: Usuário consegue registrar, fazer login, e acessar rota protegida com token ✅

---

## FASE 2: Usuários e Personagens (Backend)

### Sprint 2.1: CRUD de Usuários
**Objetivo**: Gerenciamento completo de usuários

#### Cards
- [x] **BE-USER-001**: Criar `UserSchema` com validações Zod
- [x] **BE-USER-002**: Implementar `GET /rpc/users/me` (dados do usuário logado)
  - **Depende de**: `BE-AUTH-007`
- [x] **BE-USER-003**: Implementar `PATCH /rpc/users/me` (atualizar perfil)
  - **Depende de**: `BE-USER-002`
- [x] **BE-USER-004**: Implementar `POST /rpc/users/change-password`
  - **Depende de**: `BE-AUTH-003`
- [x] **BE-USER-005**: Adicionar campo `role: USER | ADMIN` no schema
- [x] **BE-USER-006**: Criar middleware `requireAdmin` para rotas admin
  - **Depende de**: `BE-USER-005`
- [x] **BE-USER-007**: Testar todos os endpoints no Swagger UI

**Critério de Aceite**: Usuário consegue visualizar e editar seu perfil ✅

---

### Sprint 2.2: Sistema de Personagens D&D
**Objetivo**: Criação e gerenciamento de personagens

#### Cards
- [x] **BE-CHAR-001**: Criar `CharacterSchema` com atributos D&D
- [x] **BE-CHAR-002**: Criar `src/models/characterSchemas.ts` com validações
- [x] **BE-CHAR-003**: Implementar `src/stores/characterStore.ts`
- [x] **BE-CHAR-004**: Implementar `POST /rpc/characters` (criar personagem)
  - **Depende de**: `BE-CHAR-001`, `BE-CHAR-003`
- [x] **BE-CHAR-005**: Implementar `GET /rpc/characters` (listar meus personagens)
  - **Depende de**: `BE-CHAR-003`, `BE-AUTH-007`
- [x] **BE-CHAR-006**: Implementar `GET /rpc/characters/:id` (detalhes)
  - **Depende de**: `BE-CHAR-003`
- [x] **BE-CHAR-007**: Implementar `PATCH /rpc/characters/:id` (atualizar)
  - **Depende de**: `BE-CHAR-006`
- [x] **BE-CHAR-008**: Implementar `DELETE /rpc/characters/:id` (excluir)
  - **Depende de**: `BE-CHAR-006`
- [x] **BE-CHAR-009**: Validar vinculação `userId` (usuário só edita seus próprios)
  - **Depende de**: `BE-CHAR-004`
- [x] **BE-CHAR-010**: Adicionar validação de atributos (soma entre 3-18)
  - **Depende de**: `BE-CHAR-001`

**Critério de Aceite**: Usuário consegue criar, editar e excluir personagens D&D

---

### Sprint 2.3: Opções de Raças e Classes 
**Objetivo**: Dados mestres para criação de personagens

#### Cards
- [x] **BE-CHAR-011**: Criar `RaceSchema` e `ClassSchema`
- [x] **BE-CHAR-012**: Implementar `GET /rpc/character-options` (raças + classes)
  - **Depende de**: `BE-CHAR-011`
- [x] **BE-CHAR-013**: Popular dados base (Humano, Elfo, Anão, Halfling)
- [x] **BE-CHAR-014**: Popular classes (Guerreiro, Mago, Ladino, Clérigo)
- [x] **BE-CHAR-015**: Adicionar descrições e traits nas opções
- [x] **BE-CHAR-016**: Validar que raça/classe escolhidas existem no sistema
  - **Depende de**: `BE-CHAR-012`, `BE-CHAR-013`, `BE-CHAR-014`

**Critério de Aceite**: Frontend recebe lista de raças e classes para dropdowns ✅

---

## FASE 3: Histórias e Sessões (Backend)

### Sprint 3.1: Parser de Mermaid
**Objetivo**: Converter Mermaid em estrutura de capítulos

#### Cards
- [x] **BE-STORY-001**: Criar `src/services/mermaidParser.ts`
- [x] **BE-STORY-002**: Implementar parse de nós texto (`["texto"]`)
  - **Depende de**: `BE-STORY-001`
- [x] **BE-STORY-003**: Implementar parse de nós decisão (`{decisão?}`)
  - **Depende de**: `BE-STORY-002`
- [x] **BE-STORY-004**: Implementar parse de arestas com labels (`-->|label|`)
  - **Depende de**: `BE-STORY-003`
- [x] **BE-STORY-005**: Gerar mapa `capitulos: Map<id, {texto, opcoes}>`
  - **Depende de**: `BE-STORY-004`
- [x] **BE-STORY-006**: Adicionar validação de grafo (sem ciclos infinitos)
  - **Depende de**: `BE-STORY-005`
- [x] **BE-STORY-007**: Testar com arquivo `stories/caverna-misteriosa.mmd`
  - **Depende de**: `BE-STORY-006`
- [x] **BE-STORY-008**: Detectar nós de combate (`[COMBATE]`)
  - **Depende de**: `BE-STORY-005`

**Critério de Aceite**: Parser converte arquivo `.mmd` em JSON navegável ✅

---

### Sprint 3.2: CRUD de Histórias (Admin)
**Objetivo**: Gerenciamento de histórias por admins

#### Cards
- [x] **BE-STORY-009**: Criar `StorySchema` com metadados
- [x] **BE-STORY-010**: Criar `StoryMetadataSchema` (gênero, dificuldade, etc.)
- [x] **BE-STORY-011**: Implementar `src/stores/storyStore.ts`
- [x] **BE-STORY-012**: Implementar `POST /rpc/stories` (criar história, admin only)
  - **Depende de**: `BE-STORY-001`, `BE-STORY-011`, `BE-USER-006`
- [x] **BE-STORY-013**: Implementar `POST /rpc/stories/upload-mermaid` (upload arquivo)
  - **Depende de**: `BE-STORY-012`
- [x] **BE-STORY-014**: Implementar `GET /rpc/stories` (listar todas, admin)
  - **Depende de**: `BE-STORY-011`, `BE-USER-006`
- [x] **BE-STORY-015**: Implementar `GET /rpc/stories/catalog` (catálogo público)
  - **Depende de**: `BE-STORY-011`
- [x] **BE-STORY-016**: Implementar `PATCH /rpc/stories/:id` (atualizar)
  - **Depende de**: `BE-STORY-012`
- [x] **BE-STORY-017**: Implementar `DELETE /rpc/stories/:id` (excluir)
  - **Depende de**: `BE-STORY-012`
- [x] **BE-STORY-018**: Adicionar campo `isActive` para ativar/desativar histórias
  - **Depende de**: `BE-STORY-009`

**Critério de Aceite**: Admin consegue criar, editar e gerenciar histórias ✅

---

### Sprint 3.3: CRUD de Sessões
**Objetivo**: Criação e gerenciamento de sessões de jogo

#### Cards
- [x] **BE-SESSION-001**: Criar `SessionSchema` com estados (WAITING_PLAYERS, etc.)
- [x] **BE-SESSION-002**: Implementar `src/stores/sessionStore.ts`
- [x] **BE-SESSION-003**: Implementar `POST /rpc/sessions` (criar sessão)
  - **Depende de**: `BE-SESSION-001`, `BE-SESSION-002`, `BE-STORY-015`
- [x] **BE-SESSION-004**: Gerar `sessionCode` de 6 caracteres alfanuméricos
  - **Depende de**: `BE-SESSION-003`
- [x] **BE-SESSION-005**: Implementar `POST /rpc/sessions/join` (entrar via código)
  - **Depende de**: `BE-SESSION-004`
- [x] **BE-SESSION-006**: Implementar `GET /rpc/sessions` (listar minhas sessões)
  - **Depende de**: `BE-SESSION-002`, `BE-AUTH-007`
- [x] **BE-SESSION-007**: Implementar `GET /rpc/sessions/:id` (detalhes)
  - **Depende de**: `BE-SESSION-002`
- [x] **BE-SESSION-008**: Implementar `DELETE /rpc/sessions/:id` (excluir, owner only)
  - **Depende de**: `BE-SESSION-007`
- [x] **BE-SESSION-009**: Implementar `POST /rpc/sessions/:id/leave` (sair da sessão)
  - **Depende de**: `BE-SESSION-007`
- [x] **BE-SESSION-010**: Validar limite de `maxPlayers`
  - **Depende de**: `BE-SESSION-003`, `BE-SESSION-005`

**Critério de Aceite**: Usuário consegue criar sessão e outros podem entrar via código ✅

---

### Sprint 3.4: Estados de Sessão
**Objetivo**: Máquina de estados da sessão

#### Cards
- [x] **BE-SESSION-011**: Implementar transição `WAITING_PLAYERS → CREATING_CHARACTERS`
  - **Depende de**: `BE-SESSION-001`
- [x] **BE-SESSION-012**: Implementar transição `CREATING_CHARACTERS → IN_PROGRESS`
  - **Depende de**: `BE-SESSION-011`
- [x] **BE-SESSION-013**: Implementar transição `IN_PROGRESS → COMPLETED`
  - **Depende de**: `BE-SESSION-012`
- [x] **BE-SESSION-014**: Validar que todos têm personagens antes de iniciar
  - **Depende de**: `BE-CHAR-004`, `BE-SESSION-011`
- [x] **BE-SESSION-015**: Implementar `isLocked` para bloquear entrada em `IN_PROGRESS`
  - **Depende de**: `BE-SESSION-012`
- [x] **BE-SESSION-016**: Implementar `GET /rpc/sessions/:id/can-start` (validação)
  - **Depende de**: `BE-SESSION-014`
- [x] **BE-SESSION-017**: Implementar `POST /rpc/sessions/:id/start` (iniciar jogo)
  - **Depende de**: `BE-SESSION-016`
- [x] **BE-SESSION-018**: Re-habilitar validações de `sessionId` em `character_service.ts`
  - **Localização**: `src/services/character_service.ts` linhas 95-102 e 145-152
  - **Descrição**: Descomentar validações que bloqueiam edição/exclusão de personagens vinculados a sessões
  - **Lógica necessária**:
    - Permitir edição/exclusão se sessão em estado `CREATING_CHARACTERS`
    - Bloquear edição/exclusão se sessão em estado `IN_PROGRESS` ou `COMPLETED`
  - **Depende de**: `BE-SESSION-011`, `BE-SESSION-012`

**Critério de Aceite**: Sessão só inicia quando todos os participantes criaram personagens ✅

---

## FASE 4: Gameplay Core (Backend)

### Sprint 4.1: Navegação de Capítulos
**Objetivo**: Exibir e navegar pela história

#### Cards
- [x] **BE-GAME-001**: Implementar `GET /rpc/game/:sessionId/state` (capítulo atual)
  - **Depende de**: `BE-SESSION-017`, `BE-STORY-005`
- [x] **BE-GAME-002**: Retornar `{capitulo: {texto, opcoes}, participants, votos}`
  - **Depende de**: `BE-GAME-001`
- [x] **BE-GAME-003**: Implementar lógica de avanço para próximo capítulo
  - **Depende de**: `BE-GAME-002`
- [x] **BE-GAME-004**: Detectar capítulos finais (sem opções)
  - **Depende de**: `BE-GAME-003`
- [x] **BE-GAME-005**: Marcar sessão como `COMPLETED` ao chegar no fim
  - **Depende de**: `BE-GAME-004`, `BE-SESSION-013`
- [x] **BE-GAME-006**: Implementar `GET /rpc/game/:sessionId/timeline` (histórico)
  - **Depende de**: `BE-GAME-003`

**Critério de Aceite**: Jogadores veem capítulo atual e opções disponíveis ✅

---

### Sprint 4.2: Sistema de Votação
**Objetivo**: Votação colaborativa para decisões

#### Cards
- [x] **BE-VOTE-001**: Criar `VoteSchema` vinculando `characterId + opcaoId`
- [x] **BE-VOTE-002**: Implementar `POST /rpc/game/:sessionId/vote` (registrar voto)
  - **Depende de**: `BE-VOTE-001`, `BE-GAME-001`
- [x] **BE-VOTE-003**: Armazenar votos em `session.votes: Map<characterId, opcaoId>`
  - **Depende de**: `BE-VOTE-002`
- [x] **BE-VOTE-004**: Implementar `GET /rpc/game/:sessionId/votes` (status votação)
  - **Depende de**: `BE-VOTE-003`
- [x] **BE-VOTE-005**: Calcular vencedor por maioria simples
  - **Depende de**: `BE-VOTE-004`
- [x] **BE-VOTE-006**: Detectar quando todos votaram (finalizar automático)
  - **Depende de**: `BE-VOTE-005`
- [x] **BE-VOTE-007**: Implementar tratamento de empates (revote ou random)
  - **Depende de**: `BE-VOTE-005`
- [x] **BE-VOTE-008**: Avançar para próximo capítulo após resolução
  - **Depende de**: `BE-VOTE-006`, `BE-GAME-003`

**Critério de Aceite**: Jogadores votam e sistema avança automaticamente quando todos votaram ✅

---

### Sprint 4.3: Timer de Votação
**Objetivo**: Timeout automático para votações

#### Cards
- [x] **BE-VOTE-009**: Adicionar `votingTimer` na sessão
  - **Depende de**: `BE-SESSION-001`
- [x] **BE-VOTE-010**: Implementar `POST /rpc/game/:sessionId/vote-timeout` (configurar)
  - **Depende de**: `BE-VOTE-009`
- [x] **BE-VOTE-011**: Iniciar timer quando primeiro jogador vota
  - **Depende de**: `BE-VOTE-002`, `BE-VOTE-010`
- [x] **BE-VOTE-012**: Implementar `GET /rpc/game/:sessionId/vote-timer` (tempo restante)
  - **Depende de**: `BE-VOTE-011`
- [x] **BE-VOTE-013**: Finalizar votação automaticamente após timeout
  - **Depende de**: `BE-VOTE-011`, `BE-VOTE-005`
- [x] **BE-VOTE-014**: Implementar `POST /rpc/game/:sessionId/extend-timer` (estender)
  - **Depende de**: `BE-VOTE-012`
- [x] **BE-VOTE-015**: Notificar jogadores quando timer expira
  - **Depende de**: `BE-VOTE-013`

**Critério de Aceite**: Votação finaliza automaticamente após X minutos se nem todos votaram ✅

---

### Sprint 4.4: Resolução de Empates
**Objetivo**: Estratégias para resolver empates em votações

#### Cards
- [x] **BE-VOTE-016**: Implementar estratégia `REVOTE` (nova votação com opções empatadas)
  - **Depende de**: `BE-VOTE-007`
- [x] **BE-VOTE-017**: Implementar estratégia `RANDOM` (sortear opção aleatória)
  - **Depende de**: `BE-VOTE-007`
- [x] **BE-VOTE-018**: Implementar estratégia `MASTER_DECIDES` (owner escolhe)
  - **Depende de**: `BE-VOTE-007`
- [x] **BE-VOTE-019**: Implementar `POST /rpc/game/:sessionId/resolve-tie`
  - **Depende de**: `BE-VOTE-016`, `BE-VOTE-017`, `BE-VOTE-018`
- [x] **BE-VOTE-020**: Adicionar configuração de estratégia na criação da sessão
  - **Depende de**: `BE-SESSION-003`

**Critério de Aceite**: Sistema resolve empates conforme estratégia configurada ✅

---

## FASE 5: Chat e Real-time (Backend)

### Sprint 5.1: Chat via RPC
**Objetivo**: Sistema de chat em tempo real

#### Cards
- [x] **BE-CHAT-001**: Criar `MessageSchema` com `characterId`, `message`, `timestamp`
- [x] **BE-CHAT-002**: Implementar `src/stores/messageStore.ts`
- [x] **BE-CHAT-003**: Implementar `POST /rpc/chat/:sessionId/send` (enviar mensagem)
  - **Depende de**: `BE-CHAT-001`, `BE-CHAT-002`
- [x] **BE-CHAT-004**: Implementar `GET /rpc/chat/:sessionId/messages` (histórico)
  - **Depende de**: `BE-CHAT-002`
- [x] **BE-CHAT-005**: Sanitizar mensagens (evitar XSS)
  - **Depende de**: `BE-CHAT-003`
- [x] **BE-CHAT-006**: Limitar tamanho de mensagens (500 caracteres)
  - **Depende de**: `BE-CHAT-001`
- [x] **BE-CHAT-007**: Adicionar tipos de mensagem (PLAYER, SYSTEM, VOTING_UPDATE)
  - **Depende de**: `BE-CHAT-001`

**Critério de Aceite**: Jogadores enviam e recebem mensagens no chat ✅

---

### Sprint 5.2: Long Polling para Atualizações
**Objetivo**: Updates em tempo real sem WebSockets

#### Cards
- [x] **BE-POLL-001**: Criar `UpdateSchema` com tipos de eventos
- [x] **BE-POLL-002**: Implementar `src/stores/eventStore.ts` (fila de eventos)
- [x] **BE-POLL-003**: Implementar `GET /rpc/updates/:sessionId?since=lastId` (polling)
  - **Depende de**: `BE-POLL-001`, `BE-POLL-002`
- [x] **BE-POLL-004**: Retornar eventos desde `lastUpdateId`
  - **Depende de**: `BE-POLL-003`
- [x] **BE-POLL-005**: Implementar eventos: `PLAYER_JOINED`, `CHARACTER_CREATED`, etc.
  - **Depende de**: `BE-POLL-001`
- [x] **BE-POLL-006**: Implementar `GET /rpc/chat/:sessionId/messages?since=lastId`
  - **Depende de**: `BE-CHAT-004`, `BE-POLL-003`
- [x] **BE-POLL-007**: Limpar eventos antigos (>24h) periodicamente
  - **Depende de**: `BE-POLL-002`

**Critério de Aceite**: Cliente recebe atualizações em tempo real via polling ✅

---

### Sprint 5.3: Status de Conexão
**Objetivo**: Heartbeat para saber quem está online

#### Cards
- [x] **BE-POLL-008**: Adicionar campo `lastActivity` nos participantes
  - **Depende de**: `BE-SESSION-001`
- [x] **BE-POLL-009**: Implementar `POST /rpc/sessions/:sessionId/heartbeat`
  - **Depende de**: `BE-POLL-008`
- [x] **BE-POLL-010**: Atualizar `lastActivity` a cada heartbeat
  - **Depende de**: `BE-POLL-009`
- [x] **BE-POLL-011**: Marcar `isOnline: false` se sem heartbeat >5min
  - **Depende de**: `BE-POLL-010`
- [x] **BE-POLL-012**: Notificar quando jogador desconecta/reconecta
  - **Depende de**: `BE-POLL-011`, `BE-POLL-005`

**Critério de Aceite**: Sistema identifica jogadores online/offline ✅

---

## FASE 6: Sistema de Combate (Backend)

### Sprint 6.1: Detecção de Combate
**Objetivo**: Identificar nós de combate em histórias

#### Cards
- [x] **BE-COMBAT-001**: Estender parser Mermaid para detectar `[COMBATE]`
  - **Depende de**: `BE-STORY-008`
- [x] **BE-COMBAT-002**: Criar `CombatStateSchema` com iniciativa
- [x] **BE-COMBAT-003**: Implementar `POST /rpc/combat/:sessionId/initiate`
  - **Depende de**: `BE-COMBAT-001`, `BE-COMBAT-002`
- [x] **BE-COMBAT-004**: Gerar inimigos baseado em metadados do nó
  - **Depende de**: `BE-COMBAT-003`

**Critério de Aceite**: Parser detecta nós de combate e inicia combate ✅

---

### Sprint 6.2: Iniciativa e Turnos ✅
**Objetivo**: Ordem de combate

#### Cards
- [x] **BE-COMBAT-005**: Implementar `POST /rpc/combat/roll-initiative`
  - **Depende de**: `BE-COMBAT-003`, `BE-CHAR-001`
  - **Implementado**: `RollInitiativeSchema`, `rollInitiative()` service, RPC method e wrapper
- [x] **BE-COMBAT-006**: Rolar D20 + modificadores de Destreza
  - **Depende de**: `BE-COMBAT-005`
  - **Implementado**: Cálculo `d20Roll + dexterityModifier` no service
- [x] **BE-COMBAT-007**: Ordenar participantes por iniciativa
  - **Depende de**: `BE-COMBAT-006`
  - **Implementado**: Ordenação por iniciativa (decrescente) com desempate favorecendo jogadores
- [x] **BE-COMBAT-008**: Implementar sistema de turnos
  - **Depende de**: `BE-COMBAT-007`
  - **Implementado**: `turnOrder[]` e `currentTurnIndex` no CombatState
- [x] **BE-COMBAT-009**: Implementar `POST /rpc/combat/current-turn`
  - **Depende de**: `BE-COMBAT-008`
  - **Implementado**: `GetCurrentTurnSchema`, `getCurrentTurn()` service, RPC method e wrapper

**Critério de Aceite**: Combate segue ordem de iniciativa com D20 + modificadores ✅

---

### Sprint 6.3: Ataques e Dano
**Objetivo**: Mecânica de ataque D&D

#### Cards
- [x] **BE-COMBAT-010**: Implementar `POST /rpc/combat/attack`
  - **Depende de**: `BE-COMBAT-009`
  - **Implementado**: `PerformAttackSchema`, `performAttack()` service, RPC method, wrapper e OpenAPI path
- [x] **BE-COMBAT-011**: Rolar D20 vs Armor Class (acerto/erro)
  - **Depende de**: `BE-COMBAT-010`
  - **Implementado**: Lógica de rolagem D20 + modificador de Força vs AC do alvo
- [x] **BE-COMBAT-012**: Rolar dado de dano em caso de acerto
  - **Depende de**: `BE-COMBAT-011`
  - **Implementado**: Dano baseado na classe (Warrior: 1d10, Rogue/Cleric: 1d8, Mage: 1d6) + modificador de Força
- [x] **BE-COMBAT-013**: Aplicar dano ao HP do alvo
  - **Depende de**: `BE-COMBAT-012`
  - **Implementado**: Redução de HP do alvo, atualização do combat state
- [x] **BE-COMBAT-014**: Detectar morte (HP ≤ 0)
  - **Depende de**: `BE-COMBAT-013`
  - **Implementado**: Flag `isDead` ativada quando HP chega a 0, verificação de fim de combate
- [x] **BE-COMBAT-015**: Implementar crítico (natural 20) com dano dobrado
  - **Depende de**: `BE-COMBAT-011`
  - **Implementado**: Natural 20 dobra o dano total (dado + modificador) × 2
- [x] **BE-COMBAT-016**: Implementar falha crítica (natural 1) com dano ao atacante
  - **Depende de**: `BE-COMBAT-011`
  - **Implementado**: Natural 1 causa 1d4 de dano ao próprio atacante

**Critério de Aceite**: Jogadores atacam inimigos e causam dano. Críticos dobram dano. Falhas críticas causam dano ao atacante ✅

---

### Sprint 6.4: Morte e Ressurreição
**Objetivo**: Mecânica de revival

#### Cards
- [x] **BE-COMBAT-017**: Implementar `POST /rpc/combat/revive`
  - **Depende de**: `BE-COMBAT-014`
  - **Implementado**: `AttemptReviveSchema`, `attemptRevive()` service, RPC method, wrapper e OpenAPI path
- [x] **BE-COMBAT-018**: Rolar 2d10, sucesso se soma ≥ 11
  - **Depende de**: `BE-COMBAT-017`
  - **Implementado**: Lógica de rolagem 2d10 com validação `total >= 11`
- [x] **BE-COMBAT-019**: Limitar a 3 tentativas de ressurreição
  - **Depende de**: `BE-COMBAT-018`
  - **Implementado**: Campo `reviveAttempts` em CombatParticipant com limite de 3
- [x] **BE-COMBAT-020**: Marcar personagem como permanentemente morto após 3 falhas
  - **Depende de**: `BE-COMBAT-019`
  - **Implementado**: Flag `permanentlyDead` quando `reviveAttempts >= 3` e tentativa falha
- [x] **BE-COMBAT-021**: Personagem revive com 50% HP
  - **Depende de**: `BE-COMBAT-018`
  - **Implementado**: `hp = Math.floor(maxHp * 0.5)` em caso de sucesso

**Critério de Aceite**: Personagens podem ser revividos com 2d10. Máximo de 3 tentativas. Revivem com 50% HP ✅

---

## FASE 7: Painel Administrativo (Backend)

### Sprint 7.1: Gerenciamento de Usuários
**Objetivo**: Visualizar e administrar usuários

#### Cards
- [x] **BE-ADMIN-001**: Implementar `POST /rpc/admin/users` (listar todos, admin only)
  - **Depende de**: `BE-USER-006`
  - **Implementado**: `GetAllUsersSchema`, `getAllUsers()` service, RPC method, wrapper e OpenAPI path
- [x] **BE-ADMIN-002**: Adicionar estatísticas (total sessões, personagens, sessões ativas)
  - **Depende de**: `BE-ADMIN-001`
  - **Implementado**: Campo `stats` em `UserWithStatsSchema` com totalSessions, totalCharacters, activeSessions
- [x] **BE-ADMIN-003**: Implementar `POST /rpc/admin/users/delete` (excluir usuário)
  - **Depende de**: `BE-ADMIN-001`
  - **Implementado**: `DeleteUserSchema`, `deleteUser()` service com exclusão em cascata
- [x] **BE-ADMIN-004**: Retornar informações de exclusão em cascata
  - **Depende de**: `BE-ADMIN-003`
  - **Implementado**: Campo `cascadeInfo` em response com sessionsDeleted e charactersDeleted
- [x] **BE-ADMIN-005**: Implementar `POST /rpc/admin/users/promote` (tornar admin)
  - **Depende de**: `BE-ADMIN-001`
  - **Implementado**: `PromoteUserSchema`, `promoteUser()` service alterando role para ADMIN
- [x] **BE-ADMIN-006**: Implementar `POST /rpc/admin/users/demote` (remover admin)
  - **Depende de**: `BE-ADMIN-001`
  - **Implementado**: `DemoteUserSchema`, `demoteUser()` service alterando role para USER

**Critério de Aceite**: Admin visualiza e gerencia todos os usuários com estatísticas e ações de promover/remover privilégios ✅

---

### Sprint 7.2: Gerenciamento de Sessões
**Objetivo**: Visualizar e administrar sessões

#### Cards
- [x] **BE-ADMIN-007**: Implementar `POST /rpc/admin/sessions` (listar todas)
  - **Depende de**: `BE-USER-006`
  - **Implementado**: `GetAllSessionsSchema`, `getAllSessions()` service, RPC method, wrapper e OpenAPI path
- [x] **BE-ADMIN-008**: Adicionar filtros (status, owner, história)
  - **Depende de**: `BE-ADMIN-007`
  - **Implementado**: Filtros opcionais por `status`, `ownerId` e `storyId` no schema e service
- [x] **BE-ADMIN-009**: Implementar `POST /rpc/admin/sessions/detail` (detalhes completos)
  - **Depende de**: `BE-ADMIN-007`
  - **Implementado**: `GetSessionDetailSchema`, `getSessionDetail()` service incluindo votos
- [x] **BE-ADMIN-010**: Implementar `POST /rpc/admin/sessions/delete` (excluir sessão)
  - **Depende de**: `BE-ADMIN-009`
  - **Implementado**: `DeleteSessionSchema`, `deleteSession()` service com exclusão em cascata de personagens
- [x] **BE-ADMIN-011**: Implementar `POST /rpc/admin/sessions/force-state` (forçar estado)
  - **Depende de**: `BE-ADMIN-009`, `BE-SESSION-011`
  - **Implementado**: `ForceSessionStateSchema`, `forceSessionState()` service alterando status diretamente

**Critério de Aceite**: Admin visualiza e gerencia todas as sessões com filtros e controle total de estado ✅

---

### Sprint 7.3: Estatísticas do Sistema
**Objetivo**: Painel com métricas

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

### Sprint 8.2: Otimizações e Refatoração
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
- **FASE 8 (Docs/Testes)**: 20 cards
- **FASE 9 (Deploy)**: 13 cards

**TOTAL: ~196 cards backend**

### Priorização
- **P0 (Bloqueantes)**: ~25 cards (FASE 1-2)
- **P1 (Críticos)**: ~70 cards (FASE 3-4)
- **P2 (Importantes)**: ~55 cards (FASE 5, 7-8)
- **P3 (Extras)**: ~46 cards (otimizações avançadas)

---

[← Voltar ao Cronograma Principal](./13-cronograma.md) | [Frontend →](./13-cronograma-frontend.md)