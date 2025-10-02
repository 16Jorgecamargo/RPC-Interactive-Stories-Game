# 6. Fluxos do Sistema

## 6.1 Fluxo de Cadastro e Autenticação

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant AS as Auth Service
    participant US as User Store

    Note over C,US: Cadastro
    C->>S: RPC: register(username, password, confirmPassword)
    S->>AS: validarCadastro(username, password)
    AS->>US: verificarUsuarioExiste(username)
    US->>AS: usuarioNaoExiste
    AS->>AS: hashPassword(password)
    AS->>US: salvarUsuario(userData)
    S->>C: {sucesso: true, userId}

    Note over C,US: Login
    C->>S: RPC: login(username, password)
    S->>AS: autenticar(username, password)
    AS->>US: buscarUsuario(username)
    US->>AS: userData
    AS->>AS: verificarPassword(password, hash)
    AS->>AS: gerarTokenJWT(userId, role)
    S->>C: {token: "jwt_token", user: {...}}
```

## 6.2 Fluxo de Criação de Personagem e Sessão

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant CS as Character Service
    participant GS as Game Service
    participant SS as Session Store

    Note over C,SS: Criar Personagem
    C->>S: RPC: createCharacter(characterData, token)
    S->>S: validarJWT(token)
    S->>CS: criarPersonagem(characterData, userId)
    CS->>SS: salvarPersonagem(character)
    S->>C: {character: {...}}

    Note over C,SS: Criar Sessão
    C->>S: RPC: createSession(sessionData, token)
    S->>S: validarJWT(token)
    S->>GS: criarSessao(sessionData, ownerId)
    GS->>SS: salvarSessao(session)
    S->>C: {sessionId: "session_123"}

    Note over C,SS: Entrar na Sessão
    C->>S: RPC: joinSession(sessionId, characterId, token)
    S->>S: validarJWT(token)
    S->>GS: adicionarPersonagem(sessionId, characterId)
    GS->>SS: atualizarSessao(sessionId, participants)
    S->>C: {gameState: {...}}
```

## 6.3 Fluxo de Votação com Autenticação

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant VS as Voting System
    participant SS as Session Store

    C1->>S: RPC: vote(sessionId, characterId, opcaoId, token)
    S->>S: validarJWT(token)
    S->>S: verificarPersonagemNaSessao(characterId, sessionId)
    S->>VS: registrarVoto(sessionId, characterId, opcaoId)
    VS->>SS: salvarVoto(voteData)
    S->>C1: {votoConfirmado: true}

    C2->>S: RPC: vote(sessionId, characterId, opcaoId, token)
    S->>S: validarJWT(token)
    S->>VS: registrarVoto(sessionId, characterId, opcaoId)
    VS->>VS: verificarTodosVotaram(sessionId)
    VS->>VS: calcularVencedor(sessionId)
    VS->>SS: atualizarCapituloAtual(sessionId, novoCapitulo)

    Note over C1,C2: Polling para detectar mudanças
    C1->>S: RPC: checkUpdates(sessionId, lastUpdateId, token)
    S->>S: validarJWT(token)
    S->>C1: {novoCapitulo: capituloData, updateId}
    C2->>S: RPC: checkUpdates(sessionId, lastUpdateId, token)
    S->>S: validarJWT(token)
    S->>C2: {novoCapitulo: capituloData, updateId}
```

## 6.4 Fluxo de Chat com Autenticação

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant CS as Chat Service
    participant MS as Message Store

    C1->>S: RPC: sendMessage(sessionId, characterId, mensagem, token)
    S->>S: validarJWT(token)
    S->>S: verificarPersonagemNaSessao(characterId, sessionId)
    S->>CS: processarMensagem(sessionId, characterId, mensagem)
    CS->>CS: sanitizarMensagem(mensagem)
    CS->>MS: armazenarMensagem(messageData)
    S->>C1: {sucesso: true, messageId}

    Note over C2: Polling para novas mensagens
    C2->>S: RPC: getMessages(sessionId, lastMessageId, token)
    S->>S: validarJWT(token)
    S->>S: verificarAcessoSessao(userId, sessionId)
    S->>MS: buscarNovasMensagens(sessionId, lastMessageId)
    MS->>S: listaNovasMensagens
    S->>C2: {mensagens: [{characterName, mensagem, timestamp}...]}

    Note over C1: Polling para novas mensagens
    C1->>S: RPC: getMessages(sessionId, lastMessageId, token)
    S->>S: validarJWT(token)
    S->>MS: buscarNovasMensagens(sessionId, lastMessageId)
    MS->>S: listaNovasMensagens
    S->>C1: {mensagens: [...]}
```

## 6.5 Fluxo de Import de História Mermaid (Admin)

```mermaid
flowchart TD
    A[Admin faz upload/cola Mermaid] --> B[Validar JWT Admin]
    B --> C{Token válido e role=ADMIN?}
    C -->|Não| D[Erro: Não autorizado]
    C -->|Sim| E[Parse do código Mermaid]
    E --> F{Mermaid válido?}
    F -->|Não| G[Erro: Formato inválido]
    F -->|Sim| H[Converter para estrutura interna]
    H --> I[Validar com Zod]
    I --> J{Schema válido?}
    J -->|Não| K[Erro: Estrutura inválida]
    J -->|Sim| L[Salvar história no banco]
    L --> M[História disponível para uso]

    G --> N[Retornar erro para admin]
    K --> N
    D --> N
```

## 6.6 Fluxo de Gerenciamento Admin

```mermaid
sequenceDiagram
    participant A as Admin Client
    participant S as Servidor RPC
    participant AS as Admin Service
    participant US as User Store
    participant SS as Session Store

    Note over A,SS: Listar usuários
    A->>S: RPC: listUsers(token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: listarUsuarios()
    AS->>US: buscarTodosUsuarios()
    US->>AS: listaUsuarios
    S->>A: {users: [...]}

    Note over A,SS: Excluir usuário
    A->>S: RPC: deleteUser(userId, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: excluirUsuario(userId)
    AS->>SS: excluirSessoesDoUsuario(userId)
    AS->>US: excluirUsuario(userId)
    S->>A: {sucesso: true}

    Note over A,SS: Excluir sessão
    A->>S: RPC: deleteSession(sessionId, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: excluirSessao(sessionId)
    AS->>SS: excluirPersonagensDaSessao(sessionId)
    AS->>SS: excluirSessao(sessionId)
    S->>A: {sucesso: true}
```

## 6.7 Fluxo de Home Pós-Login

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant SS as Session Service
    participant StS as Story Service

    C->>S: RPC: getHome(token)
    S->>S: validarJWT(token)
    S->>SS: buscarSessoesDoUsuario(userId)
    SS->>SS: compilarMetadadosHome()

    alt Usuário tem sessões
        SS->>S: sessionsWithMetadata
        S->>C: {hasSessions: true, sessionCards: [...], actions: ["create", "join"]}
    else Usuário sem sessões
        SS->>S: emptyArray
        S->>C: {hasSessions: false, actions: ["create", "join"], showWelcome: true}
    end

    Note over C,S: Usuário clica em "Criar Sessão"
    C->>S: RPC: getAvailableStories(token)
    S->>StS: listarHistoriasAtivas()
    StS->>S: storiesWithMetadata
    S->>C: {stories: [{title, genre, synopsis, recommendedPlayers}...]}
```

## 6.8 Fluxo de Criação de Sessão com Seleção de História

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant StS as Story Service
    participant SS as Session Service

    C->>S: RPC: getStoryCatalog(token)
    S->>S: validarJWT(token)
    S->>StS: listarHistoriasComMetadados()
    StS->>S: catalogoCompleto
    S->>C: {stories: [{id, title, genre, synopsis, recommendedPlayers, difficulty}...]}

    Note over C,S: Usuário seleciona história e define nome
    C->>S: RPC: createSessionWithStory(sessionName, storyId, token)
    S->>S: validarJWT(token)
    S->>StS: validarHistoriaExiste(storyId)
    StS->>S: historiaValida
    S->>SS: criarSessaoComCodigo(sessionName, storyId, ownerId)
    SS->>SS: gerarCodigoUnico()
    SS->>SS: salvarSessao(sessionData)
    S->>C: {sessionId, sessionCode, redirectTo: "waitingRoom"}

    Note over C,S: Redirect automático para sala de espera
    C->>S: RPC: getWaitingRoomState(sessionId, token)
    S->>SS: buscarEstadoSalaEspera(sessionId)
    SS->>S: estadoAtual
    S->>C: {waitingRoomData, sessionCode, canStart: false}
```

## 6.9 Fluxo de Criação de Personagens D&D

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant CS as Character Service
    participant SS as Session Service

    Note over C,S: Usuário entra na sessão e é direcionado para criação
    C->>S: RPC: getCharacterCreationData(token)
    S->>S: validarJWT(token)
    S->>CS: obterOpcoesPersonagem()
    CS->>S: {races, classes, attributeOptions}
    S->>C: {races: [...], classes: [...], attributes: [...]}

    Note over C,S: Usuário preenche dados do personagem
    C->>S: RPC: createDnDCharacter(characterData, sessionId, token)
    S->>S: validarJWT(token)
    S->>CS: validarDadosPersonagem(characterData)
    CS->>CS: calcularAtributos(race, class, customAttributes)
    CS->>CS: validarCompletudePersonagem()
    CS->>SS: salvarPersonagemCompleto(characterData)
    S->>C: {character: {...}, isComplete: true, canProceed: true}

    Note over C,S: Atualizar estado da sessão
    C->>S: RPC: notifyCharacterCreated(sessionId, token)
    S->>SS: marcarPersonagemPronto(sessionId, userId)
    S->>SS: verificarTodosProntos(sessionId)

    alt Todos os personagens criados
        SS->>S: todosProntos
        S->>C: {allReady: true, canStartSession: true}
    else Ainda aguardando outros
        SS->>S: aguardandoOutros
        S->>C: {allReady: false, waitingFor: ["user_124", ...]}
    end
```

## 6.10 Fluxo da Sala de Espera e Validação

```mermaid
sequenceDiagram
    participant C1 as Cliente 1 (Owner)
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant SS as Session Service
    participant NS as Notification Service

    Note over C1,S: Polling do estado da sala de espera
    loop Polling contínuo
        C1->>S: RPC: getWaitingRoomState(sessionId, token)
        S->>SS: buscarEstadoAtualizado(sessionId)
        SS->>S: estadoDetalhado
        S->>C1: {participants: [...], allReady: false, canStart: false}
    end

    Note over C2,S: Usuário 2 entra via código
    C2->>S: RPC: joinSessionByCode(sessionCode, token)
    S->>S: validarJWT(token)
    S->>SS: buscarSessaoPorCodigo(sessionCode)
    S->>SS: validarEstadoPermiteEntrada(sessionId)
    S->>SS: adicionarParticipante(sessionId, userId)
    S->>NS: notificarNovoParticipante(sessionId, userData)
    S->>C2: {joined: true, sessionId, redirectTo: "characterCreation"}

    Note over C1,S: Notificação de novo participante
    C1->>S: RPC: checkUpdates(sessionId, lastUpdateId, token)
    S->>NS: buscarAtualizacoes(sessionId, lastUpdateId)
    NS->>S: novasAtualizacoes
    S->>C1: {updates: [{type: "PLAYER_JOINED", data: {...}}]}

    Note over C2,S: Usuário 2 cria personagem
    C2->>S: RPC: createDnDCharacter(characterData, sessionId, token)
    S->>SS: salvarPersonagemCompleto(characterData)
    S->>NS: notificarPersonagemCriado(sessionId, characterData)
    S->>C2: {character: {...}, isComplete: true}

    Note over C1,S: Verificação de todos prontos
    C1->>S: RPC: checkUpdates(sessionId, lastUpdateId, token)
    S->>SS: verificarTodosProntos(sessionId)
    SS->>S: todosProntosParaIniciar
    S->>C1: {updates: [{type: "ALL_CHARACTERS_READY", canStart: true}]}

    Note over C1,S: Owner inicia a sessão
    C1->>S: RPC: startGameSession(sessionId, token)
    S->>S: validarOwnership(sessionId, userId)
    S->>SS: iniciarSessao(sessionId)
    SS->>SS: mudarEstado(IN_PROGRESS)
    SS->>SS: bloquearNovasEntradas()
    S->>NS: notificarInicioJogo(sessionId)
    S->>C1: {started: true, redirectTo: "gameScreen"}

    Note over C2,S: Notificação de início para outros jogadores
    C2->>S: RPC: checkUpdates(sessionId, lastUpdateId, token)
    S->>NS: buscarAtualizacoes(sessionId, lastUpdateId)
    NS->>S: jogoIniciado
    S->>C2: {updates: [{type: "GAME_STARTED", redirectTo: "gameScreen"}]}
```

## 6.11 Fluxo de Entrada via Código de Sessão

```mermaid
flowchart TD
    A[Usuário insere código] --> B[Validar formato do código]
    B --> C{Código válido?}
    C -->|Não| D[Erro: Código inválido]
    C -->|Sim| E[Buscar sessão por código]
    E --> F{Sessão existe?}
    F -->|Não| G[Erro: Sessão não encontrada]
    F -->|Sim| H[Verificar estado da sessão]
    H --> I{Estado permite entrada?}
    I -->|COMPLETED| J[Erro: Sessão finalizada]
    I -->|IN_PROGRESS| K{Usuário é participante original?}
    K -->|Não| L[Erro: Sessão em andamento]
    K -->|Sim| M[Reconectar à sessão]
    I -->|WAITING_PLAYERS ou CREATING_CHARACTERS| N[Verificar limite de jogadores]
    N --> O{Há vagas?}
    O -->|Não| P[Erro: Sessão lotada]
    O -->|Sim| Q[Adicionar usuário à sessão]
    Q --> R[Redirecionar baseado no estado]
    R --> S{Estado da sessão}
    S -->|WAITING_PLAYERS| T[Ir para sala de espera]
    S -->|CREATING_CHARACTERS| U[Ir para criação de personagem]
    M --> V[Ir para tela de jogo]
```

## 6.12 Fluxo do Painel Administrativo

```mermaid
sequenceDiagram
    participant A as Admin Client
    participant S as Servidor RPC
    participant AS as Admin Service
    participant US as User Store
    participant SS as Session Store

    Note over A,S: Login administrativo
    A->>S: RPC: login(username, password)
    S->>S: validarCredenciais(username, password)
    S->>A: {token, user: {role: "ADMIN"}}

    Note over A,S: Home administrativo
    A->>S: RPC: getAdminHome(token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: obterHomeAdmin(userId)
    AS->>S: homeData + hasManagementAccess: true
    S->>A: {home, hasManagementAccess: true}

    Note over A,S: Acessar painel de gerenciamento
    A->>S: RPC: getManagementPanel(token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: listarUsuariosComEstatisticas()
    AS->>US: buscarTodosUsuarios()
    AS->>SS: calcularEstatisticasPorUsuario()
    AS->>S: usersWithStats
    S->>A: {users: [{id, username, statistics}...]}
```

## 6.13 Fluxo de Visualização de Sessões por Usuário (Admin)

```mermaid
sequenceDiagram
    participant A as Admin Client
    participant S as Servidor RPC
    participant AS as Admin Service
    participant SS as Session Store
    participant US as User Store

    Note over A,S: Visualizar sessões de usuário específico
    A->>S: RPC: getUserSessions(userId, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>US: buscarUsuario(userId)
    US->>S: userData
    S->>AS: buscarSessoesDoUsuario(userId)
    AS->>SS: listarSessoesComDetalhes(userId)
    SS->>AS: sessionsWithDetails
    S->>A: {user: userData, sessions: [...]}

    Note over A,S: Visualizar detalhes completos de sessão
    A->>S: RPC: getSessionFullDetails(sessionId, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: obterDetalhesCompletos(sessionId)
    AS->>SS: buscarSessaoCompleta(sessionId)
    AS->>SS: buscarParticipantes(sessionId)
    AS->>SS: calcularEstatisticas(sessionId)
    AS->>S: fullSessionDetails
    S->>A: {session: {...}, participants: [...], progress: {...}}
```

## 6.14 Fluxo de Exclusão com Confirmação (Admin)

```mermaid
sequenceDiagram
    participant A as Admin Client
    participant S as Servidor RPC
    participant AS as Admin Service
    participant US as User Store
    participant SS as Session Store

    Note over A,S: Confirmar exclusão de usuário
    A->>S: RPC: confirmDeleteUser(userId, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: calcularImpactoExclusao(userId)
    AS->>SS: contarSessoesDoUsuario(userId)
    AS->>SS: contarPersonagensDoUsuario(userId)
    AS->>S: {sessionsToDelete, charactersToDelete}
    S->>A: {confirmation: {message, cascadeInfo}}

    Note over A,S: Dialog de confirmação no cliente
    A->>A: exibirDialog("Tem certeza? Isso excluirá X sessões")

    Note over A,S: Executar exclusão após confirmação
    A->>S: RPC: executeDeleteUser(userId, confirmed=true, token)
    S->>S: validarJWT(token, role=ADMIN)
    S->>AS: excluirUsuarioCompleto(userId)
    AS->>SS: excluirSessoesDoUsuario(userId)
    AS->>SS: excluirPersonagensDoUsuario(userId)
    AS->>US: excluirUsuario(userId)
    S->>A: {sucesso: true, deletedSessions: X, deletedCharacters: Y}

    Note over A,S: Fluxo similar para exclusão de sessão
    A->>S: RPC: confirmDeleteSession(sessionId, token)
    S->>AS: obterInfoSessao(sessionId)
    S->>A: {confirmation: {message, sessionInfo}}
    A->>S: RPC: executeDeleteSession(sessionId, confirmed=true, token)
    S->>AS: excluirSessaoCompleta(sessionId)
    S->>A: {sucesso: true, removedParticipants: Z}
```

## 6.15 Fluxo da Tela de Jogo com Timeline e Votação

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant GS as Game Service
    participant VS as Voting System
    participant TS as Timer Service

    Note over C1,C2: Carregar tela de jogo
    C1->>S: RPC: getGameScreenState(sessionId, token)
    S->>GS: obterEstadoCompletoJogo(sessionId)
    GS->>S: {gameState, timeline, playerTiles, chatState}
    S->>C1: dados completos da tela

    C2->>S: RPC: getGameScreenState(sessionId, token)
    S->>C2: dados completos da tela

    Note over C1,C2: Timeline exibe capítulo atual
    S->>C1: {timeline: {currentEntry: {text: "Vocês chegam à caverna...", options: [...]}}}
    S->>C2: {timeline: {currentEntry: {text: "Vocês chegam à caverna...", options: [...]}}}

    Note over C1,S: Primeiro jogador vota - inicia timer
    C1->>S: RPC: vote(sessionId, characterId, "entrar", token)
    S->>VS: registrarVoto(sessionId, characterId, "entrar")
    S->>TS: iniciarTimer(sessionId, tempoLimite)
    S->>C1: {sucesso: true, timerStarted: true, timeRemaining: 60}

    Note over C1,C2: Polling para atualizações do jogo
    loop Polling contínuo
        C2->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
        S->>VS: verificarAtualizacoes(sessionId, lastUpdateId)
        S->>C2: {updates: [{type: "VOTE_RECEIVED", data: {characterName: "Aragorn", optionChosen: "entrar"}}], timerUpdate: {timeRemaining: 55}}

        C1->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
        S->>C1: {updates: [...], timerUpdate: {timeRemaining: 55}}
    end

    Note over C2,S: Segundo jogador vota
    C2->>S: RPC: vote(sessionId, characterId, "entrar", token)
    S->>VS: registrarVoto(sessionId, characterId, "entrar")
    S->>VS: verificarTodosVotaram(sessionId)
    VS->>VS: todos votaram, finalizar votação
    S->>C2: {sucesso: true}

    Note over S,TS: Finalizar votação por unanimidade
    S->>VS: finalizarVotacao(sessionId)
    VS->>VS: calcularVencedor("entrar": 2 votos)
    VS->>GS: avancarCapitulo(sessionId, "dentro-caverna")
    S->>TS: cancelarTimer(sessionId)

    Note over C1,C2: Notificar conclusão da votação
    C1->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>C1: {updates: [{type: "VOTING_COMPLETED", data: {result: {winningOption: "entrar", method: "UNANIMOUS"}}}]}

    C2->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>C2: {updates: [{type: "CHAPTER_CHANGED", data: {newChapter: {text: "Vocês entram na caverna escura..."}}}]}
```

## 6.16 Fluxo de Votação com Timeout Automático

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant VS as Voting System
    participant TS as Timer Service

    Note over C1,C2: Cenário: Nem todos votam, timer expira

    C1->>S: RPC: vote(sessionId, characterId, "entrar", token)
    S->>VS: registrarVoto(sessionId, characterId, "entrar")
    S->>TS: iniciarTimer(sessionId, 60s)
    S->>C1: {sucesso: true, timerStarted: true}

    Note over TS: Timer executando countdown
    loop Timer ativo
        TS->>TS: decrementarTimer()
        TS->>VS: notificarTempoRestante(sessionId, timeRemaining)
    end

    Note over TS: Timer expira - C2 não votou
    TS->>VS: timeoutVotacao(sessionId)
    VS->>VS: contarVotos({entrar: 1, voltar: 0, sem_voto: 1})
    VS->>VS: determinarVencedor("entrar" - maioria relativa)
    VS->>GS: avancarCapitulo(sessionId, "dentro-caverna")

    Note over S: Notificar resultado por timeout
    S->>VS: obterResultadoVotacao(sessionId)

    C1->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>C1: {updates: [{type: "VOTING_COMPLETED", data: {result: {winningOption: "entrar", method: "TIMEOUT"}}}]}

    C2->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>C2: {updates: [{type: "CHAPTER_CHANGED", data: {newChapter: {...}}}]}
```

## 6.17 Fluxo de Visualização de Ficha de Personagem

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant CS as Character Service
    participant SS as Session Store

    Note over C,S: Usuário visualiza tiles de jogadores
    C->>S: RPC: getPlayerTiles(sessionId, token)
    S->>SS: buscarParticipantesComStatus(sessionId)
    SS->>S: playerTiles
    S->>C: {players: [{characterName, miniDescription, isOnline, hasVoted}...]}

    Note over C,S: Clique em "Visualizar" personagem
    C->>S: RPC: getCharacterSheet(characterId, sessionId, token)
    S->>S: validarJWT(token)
    S->>SS: validarAcessoSessao(userId, sessionId)
    S->>CS: obterFichaCompleta(characterId)
    CS->>CS: compilarDadosCompletos(characterId)
    CS->>S: fullCharacterSheet
    S->>C: {character: {basic, attributes, background, equipment, gameStats}}

    Note over C: Dialog exibe ficha completa com dados D&D
    C->>C: exibirDialog("Ficha do Personagem")

    Note over C: Dialog contém: nome, raça, classe, atributos, história, equipamentos
```

## 6.18 Fluxo de Inicialização de Combate e Rolagem de Iniciativa

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant S as Servidor RPC
    participant CS as Combat Service
    participant DS as Dice Service

    Note over C1,C2: Capítulo com flag "fight" é alcançado
    C1->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>CS: detectarCombate(chapterId)
    CS->>CS: inicializarCombate(sessionId, inimigos)
    S->>C1: {updates: [{type: "COMBAT_STARTED", data: {combatState, enemies}}]}

    C2->>S: RPC: checkGameUpdates(sessionId, lastUpdateId, token)
    S->>C2: {updates: [{type: "COMBAT_STARTED", data: {combatState, enemies}}]}

    Note over C1,C2: Dialog de iniciativa aparece para todos
    C1->>S: RPC: getCombatState(sessionId, token)
    S->>CS: obterEstadoCombate(sessionId)
    S->>C1: {combat: {phase: "INITIATIVE"}, participants: [...], enemies: [...]}

    Note over C1,S: Jogador 1 rola iniciativa
    C1->>S: RPC: rollInitiative(sessionId, characterId, token)
    S->>DS: rolarD20ComModificadores(dexterity)
    DS->>S: {roll: 15, modifiers: 2, total: 17}
    S->>CS: registrarIniciativa(characterId, 17)
    S->>C1: {rollResult: 17, diceAnimation: {...}, orderPosition: 2}

    Note over C2,S: Jogador 2 não rola - timer expira
    loop Timer de iniciativa
        S->>CS: verificarTimerIniciativa(sessionId)
        CS->>DS: rolarAutomatico(characterId)
        DS->>CS: {roll: 8, modifiers: 1, total: 9}
    end

    Note over S,CS: Todos rolaram - calcular ordem
    S->>CS: calcularOrdemIniciativa(sessionId)
    CS->>CS: ordenarPorIniciativa(participantes + inimigos)
    CS->>S: ordemCompleta

    Note over C1,C2: Notificar ordem de iniciativa
    C1->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C1: {updates: [{type: "INITIATIVE_COMPLETED", data: {initiativeOrder: [...]}}]}

    C2->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C2: {updates: [{type: "INITIATIVE_COMPLETED", data: {initiativeOrder: [...]}}]}
```

## 6.19 Fluxo de Turnos de Ataque com Seleção de Alvos

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor RPC
    participant CS as Combat Service
    participant AS as AI Service

    Note over C,S: Turno do jogador
    C->>S: RPC: getCombatState(sessionId, token)
    S->>CS: obterTurnoAtual(sessionId)
    S->>C: {currentTurn: {combatantId, timeRemaining, availableTargets: [...]}}

    Note over C,S: Jogador seleciona alvo
    C->>S: RPC: selectTarget(sessionId, attackerId, targetId, token)
    S->>CS: validarAlvo(attackerId, targetId)
    CS->>CS: registrarSelecaoAlvo(attackerId, targetId)
    S->>C: {targetSelected: true, autoAttackTimer: 30}

    Note over C,S: Executar ataque
    C->>S: RPC: rollAttack(sessionId, attackerId, targetId, token)
    S->>CS: executarAtaque(attackerId, targetId)
    CS->>CS: rolarD20VsCA(attackBonus, targetAC)
    CS->>CS: determinarResultado(roll, CA, criticos)
    S->>C: {attackResult: {result: "HIT", rollResult: 16}, diceAnimation: {...}}

    Note over S,CS: Turno do inimigo (automático)
    S->>AS: processarTurnoInimigo(enemyId)
    AS->>AS: escolherAlvoAleatorio(enemies, players)
    AS->>CS: executarAtaqueInimigo(enemyId, targetId)
    CS->>CS: rolarAtaqueInimigo(enemyStats, targetAC)
    S->>AS: {enemyAction: {action: "ATTACK", targetId, reasoning: "Alvo mais fraco"}}

    Note over C,S: Notificar ação do inimigo
    C->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C: {updates: [{type: "ENEMY_ATTACK", data: {enemyAction, attackResult}}]}
```

## 6.20 Fluxo de Sistema de Ataque D20 vs CA com Críticos

```mermaid
flowchart TD
    A[Iniciar Ataque] --> B[Rolar D20]
    B --> C{Resultado do D20}

    C -->|1 - Falha Critica| D[Miss + Dano ao Atacante]
    C -->|2-19 - Normal| E[Somar Modificadores]
    C -->|20 - Acerto Critico| F[Hit + Dano Critico]

    E --> G{Total >= CA do Alvo?}
    G -->|Nao| H[Miss - Errou o Ataque]
    G -->|Sim| I[Hit - Acertou o Ataque]

    D --> J[Aplicar Dano de Falha Critica ao Atacante]
    H --> K[Proximo Turno]
    I --> L[Rolar Dados de Dano]
    F --> M[Rolar Dados de Dano x2]

    J --> N[Atualizar HP do Atacante]
    L --> O[Aplicar Modificadores de Dano]
    M --> P[Aplicar Modificadores + Critico]

    N --> K
    O --> Q[Calcular Resistencias/Fraquezas]
    P --> Q

    Q --> R[Aplicar Dano Final ao Alvo]
    R --> S{Alvo HP <= 0?}

    S -->|Nao| T[Atualizar HP do Alvo]
    S -->|Sim| U[Marcar Alvo como Morto]

    T --> K
    U --> V{Todos Inimigos Mortos?}
    V -->|Sim| W[Vitoria - Finalizar Combate]
    V -->|Nao| K

    K --> X{Todos Jogadores Mortos?}
    X -->|Sim| Y[Derrota - Finalizar Combate]
    X -->|Nao| Z[Proximo Turno na Ordem]
```

## 6.21 Fluxo de Sistema de Morte e Ressurreição 2d10

```mermaid
sequenceDiagram
    participant C as Cliente (Morto)
    participant S as Servidor RPC
    participant CS as Combat Service
    participant DS as Dice Service

    Note over C,S: Personagem morre (HP ≤ 0)
    S->>CS: marcarComoMorto(characterId)
    CS->>CS: definirEstado(characterId, "DEAD")

    Note over C,S: Turno do personagem morto
    C->>S: RPC: getCombatState(sessionId, token)
    S->>CS: verificarEstadoPersonagem(characterId)
    S->>C: {currentTurn, canRevive: true, attemptsRemaining: 3}

    Note over C,S: Dialog de ressurreição aparece
    C->>S: RPC: attemptRevive(sessionId, characterId, token)
    S->>DS: rolar2D10()
    DS->>S: {dice1: 7, dice2: 4, results: [7, 4]}
    S->>CS: verificarRessurreicao(dice1, dice2)
    CS->>CS: dice1 !== dice2 → falha
    S->>C: {reviveResult: {success: false, attemptsRemaining: 2}, diceAnimation: {...}}

    Note over C,S: Segunda tentativa (próximo turno)
    C->>S: RPC: attemptRevive(sessionId, characterId, token)
    S->>DS: rolar2D10()
    DS->>S: {dice1: 6, dice2: 6, results: [6, 6]}
    S->>CS: verificarRessurreicao(dice1, dice2)
    CS->>CS: dice1 === dice2 → sucesso!
    CS->>CS: restaurarHP(characterId, percentual)
    CS->>CS: definirEstado(characterId, "ALIVE")
    S->>C: {reviveResult: {success: true, newHP: 15}, diceAnimation: {...}}

    Note over C,S: Personagem volta ao combate
    C->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C: {updates: [{type: "CHARACTER_REVIVED", data: {characterName, newHP}}]}

    Note over C,S: Cenário alternativo - 3 falhas
    alt Todas as 3 tentativas falharam
        S->>CS: marcarComoMortoPermanente(characterId)
        CS->>CS: definirEstado(characterId, "PERMANENTLY_DEAD")
        S->>C: {reviveResult: {isPermanentlyDead: true}, redirectTo: "spectatorMode"}
    end
```

## 6.22 Fluxo de Resolução de Combate com Recompensas

```mermaid
sequenceDiagram
    participant C1 as Cliente 1 (Vivo)
    participant C2 as Cliente 2 (Morto Permanente)
    participant S as Servidor RPC
    participant CS as Combat Service
    participant XS as XP Service

    Note over S,CS: Último inimigo é derrotado
    S->>CS: verificarCondicaoVitoria(sessionId)
    CS->>CS: todosInimigosEstaoMortos = true
    CS->>XS: calcularRecompensas(sessionId, sobreviventes)
    XS->>XS: calcularXP(inimigosVencidos, participantesVivos)
    XS->>XS: calcularRecuperacaoHP(sobreviventes)

    Note over S,CS: Finalizar combate
    S->>CS: finalizarCombate(sessionId)
    CS->>CS: compilarEstatisticas(participantes)
    CS->>S: {victory: true, rewards: {...}, stats: [...]}

    Note over C1,S: Dialog de vitória para sobreviventes
    C1->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C1: {updates: [{type: "COMBAT_ENDED", data: combatRewards}]}

    Note over C2,S: Notificação para mortos permanentes
    C2->>S: RPC: checkCombatUpdates(sessionId, lastUpdateId, token)
    S->>C2: {updates: [{type: "COMBAT_ENDED", data: spectatorResults}]}

    Note over C1,C2: Aplicar recompensas
    S->>CS: aplicarRecompensas(sobreviventes, rewards)
    CS->>CS: adicionarXP(characterIds, xpAmount)
    CS->>CS: recuperarHP(characterIds, hpAmount)

    Note over S: Retornar ao jogo normal
    S->>CS: retornarAoJogoNormal(sessionId)
    CS->>CS: limparEstadoCombate(sessionId)
    S->>C1: {redirectTo: "gameScreen", combatEnded: true}
    S->>C2: {redirectTo: "spectatorMode", combatEnded: true}
```

---

[← Anterior: Arquitetura](./05-arquitetura.md) | [Voltar ao Menu](./README.md) | [Próximo: APIs RPC →](./07-apis-rpc.md)