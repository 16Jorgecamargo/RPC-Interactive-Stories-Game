# 7. APIs RPC

## 7.1 Métodos do Servidor

### Autenticação e Usuários
```javascript
// Cadastrar novo usuário
register(username: string, password: string, confirmPassword: string): Promise<{sucesso: boolean, userId?: string, erro?: string}>

// Login com JWT
login(username: string, password: string): Promise<{token: string, user: User, expiresIn: number}>

// Validar token JWT
validateToken(token: string): Promise<{valid: boolean, user?: User}>

// Logout (invalidar token)
logout(token: string): Promise<{sucesso: boolean}>

// Alterar senha
changePassword(currentPassword: string, newPassword: string, token: string): Promise<{sucesso: boolean}>
```

### Dashboard e Navegação
```javascript
// Obter dashboard pós-login
getDashboard(token: string): Promise<{hasSessions: boolean, sessionCards?: SessionCard[], actions: string[], showWelcome?: boolean}>

// Obter cards de sessão com metadados
getSessionCards(token: string): Promise<{sessionCards: SessionCard[]}>

// Obter catálogo de histórias para criação de sessão
getStoryCatalog(token: string): Promise<{stories: StoryWithMetadata[]}>
```

### Gerenciamento de Personagens D&D
```javascript
// Obter opções para criação de personagem (raças, classes, etc.)
getCharacterCreationData(token: string): Promise<{races: Race[], classes: Class[], attributeRanges: AttributeRanges}>

// Criar personagem D&D completo
createDnDCharacter(characterData: DnDCharacterData, sessionId: string, token: string): Promise<{character: DnDCharacter, isComplete: boolean}>

// Validar dados de personagem D&D
validateCharacterData(characterData: DnDCharacterData, token: string): Promise<{valid: boolean, errors?: string[]}>

// Obter personagem do usuário em uma sessão específica
getMyCharacterInSession(sessionId: string, token: string): Promise<{character?: DnDCharacter, hasCharacter: boolean}>

// Atualizar personagem D&D
updateDnDCharacter(characterId: string, updates: Partial<DnDCharacterData>, token: string): Promise<{character: DnDCharacter}>

// Excluir personagem
deleteCharacter(characterId: string, token: string): Promise<{sucesso: boolean}>

// Listar personagens do usuário
listMyCharacters(token: string): Promise<{characters: DnDCharacter[]}>

// Listar personagens em uma sessão (visão completa para membros)
listSessionCharacters(sessionId: string, token: string): Promise<{characters: DnDCharacter[]}>

// Obter mini descrições de personagens para sala de espera
getCharacterSummaries(sessionId: string, token: string): Promise<{summaries: CharacterSummary[]}>
```

### Sessões Expandidas
```javascript
// Criar nova sessão com seleção de história
createSessionWithStory(sessionData: {name: string, storyId: string}, token: string): Promise<{sessionId: string, sessionCode: string, redirectTo: string}>

// Entrar em sessão via código
joinSessionByCode(sessionCode: string, token: string): Promise<{joined: boolean, sessionId: string, redirectTo: string}>

// Obter estado da sala de espera
getWaitingRoomState(sessionId: string, token: string): Promise<{participants: ParticipantInfo[], canStart: boolean, sessionCode: string, story: StoryInfo}>

// Notificar criação de personagem
notifyCharacterCreated(sessionId: string, token: string): Promise<{allReady: boolean, waitingFor?: string[]}>

// Iniciar sessão de jogo (apenas owner)
startGameSession(sessionId: string, token: string): Promise<{started: boolean, redirectTo: string}>

// Listar sessões disponíveis (públicas)
listPublicSessions(token: string): Promise<{sessions: PublicSessionInfo[]}>

// Listar minhas sessões
listMySessions(token: string): Promise<{sessions: SessionWithMetadata[]}>

// Entrar em sessão existente (reconexão)
rejoinSession(sessionId: string, token: string): Promise<{gameState: GameState, redirectTo: string}>

// Sair da sessão
leaveSession(sessionId: string, token: string): Promise<{sucesso: boolean}>

// Excluir sessão própria
deleteSession(sessionId: string, token: string): Promise<{sucesso: boolean}>

// Obter detalhes completos da sessão
getSessionDetails(sessionId: string, token: string): Promise<{session: ExtendedSession, participants: DnDCharacter[]}>

// Verificar se usuário pode entrar na sessão
canJoinSession(sessionId: string, token: string): Promise<{canJoin: boolean, reason?: string, redirectTo?: string}>
```

### Jogo
```javascript
// Obter estado completo da tela de jogo
getGameScreenState(sessionId: string, token: string): Promise<{gameState: GameScreenState, timeline: TimelineData, playerTiles: PlayerTile[], chatState: ChatState}>

// Obter estado atual do capítulo e votação
getGameState(sessionId: string, token: string): Promise<{capitulo: Chapter, participants: Character[], votos: Vote[], votingTimer: VotingTimer}>

// Votar em opção com início de timer
vote(sessionId: string, characterId: string, opcaoId: string, token: string): Promise<{sucesso: boolean, timerStarted: boolean, timeRemaining: number}>

// Obter estado do timer de votação
getVotingTimer(sessionId: string, token: string): Promise<{isActive: boolean, timeRemaining: number, totalVotes: number, requiredVotes: number}>

// Obter tiles dos jogadores com status
getPlayerTiles(sessionId: string, token: string): Promise<{players: PlayerTile[]}>

// Visualizar ficha completa de personagem
getCharacterSheet(characterId: string, sessionId: string, token: string): Promise<{character: FullCharacterSheet}>

// Verificar atualizações da tela de jogo
checkGameUpdates(sessionId: string, lastUpdateId: string, token: string): Promise<{updates: GameUpdate[], lastUpdateId: string, timerUpdate?: VotingTimer}>

// Obter histórico da timeline
getTimelineHistory(sessionId: string, limit: number, token: string): Promise<{timeline: TimelineEntry[]}>

// Atualizar status de conexão (heartbeat)
updatePlayerStatus(sessionId: string, token: string): Promise<{sucesso: boolean, statusUpdated: boolean}>

// Forçar finalização de votação (quando tempo expira)
finalizeVoting(sessionId: string, token: string): Promise<{result: VotingResult, nextChapter: Chapter}>

// Obter histórias disponíveis
getAvailableStories(token: string): Promise<{stories: Story[]}>

// Obter histórico de ações da sessão
getSessionHistory(sessionId: string, token: string): Promise<{actions: Action[]}>
```

### Sistema de Combate
```javascript
// Detectar e inicializar combate
initiateCombat(sessionId: string, chapterId: string, token: string): Promise<{combatState: CombatState, enemies: Enemy[], participants: CombatParticipant[]}>

// Rolar iniciativa com timer
rollInitiative(sessionId: string, characterId: string, token: string): Promise<{rollResult: number, diceAnimation: DiceAnimation, orderPosition: number}>

// Obter estado completo do combate
getCombatState(sessionId: string, token: string): Promise<{combat: CombatState, currentTurn: CombatTurn, participants: CombatParticipant[], enemies: Enemy[]}>

// Selecionar alvo para ataque
selectTarget(sessionId: string, attackerId: string, targetId: string, token: string): Promise<{targetSelected: boolean, autoAttackTimer: number}>

// Executar ataque D20 vs CA
rollAttack(sessionId: string, attackerId: string, targetId: string, token: string): Promise<{attackResult: AttackResult, diceAnimation: DiceAnimation, damage?: DamageRoll}>

// Rolar dados de dano
rollDamage(sessionId: string, attackResult: AttackResult, token: string): Promise<{damageResult: DamageResult, finalDamage: number, targetNewHP: number}>

// Tentar ressurreição com 2d10
attemptRevive(sessionId: string, characterId: string, token: string): Promise<{reviveResult: ReviveResult, diceAnimation: DiceAnimation, attemptsRemaining: number}>

// Finalizar combate com recompensas
finalizeCombat(sessionId: string, token: string): Promise<{victory: boolean, rewards: CombatRewards, survivorStats: ParticipantStats[]}>

// Obter atualizações de combate
checkCombatUpdates(sessionId: string, lastUpdateId: string, token: string): Promise<{updates: CombatUpdate[], combatState: CombatState}>

// Processar turno automático (inimigos)
processEnemyTurn(sessionId: string, enemyId: string, token: string): Promise<{enemyAction: EnemyAction, attackResult?: AttackResult}>

// Validar se pode agir no combate
canActInCombat(sessionId: string, characterId: string, token: string): Promise<{canAct: boolean, state: CombatantState, restrictions: string[]}>
```

### Tipos Específicos para Sistema de Combate
```javascript
// Estado completo do combate
type CombatState = {
  sessionId: string;
  combatId: string;
  phase: 'INITIATIVE' | 'COMBAT_TURNS' | 'COMPLETED';
  currentRound: number;
  currentTurn: number;
  initiativeOrder: InitiativeEntry[];
  isActive: boolean;
  startedAt: Date;
  completedAt?: Date;
  victoryCondition: 'ALL_ENEMIES_DEAD' | 'ALL_PLAYERS_DEAD' | 'SPECIAL';
};

// Participante do combate
type CombatParticipant = {
  id: string;
  characterId: string;
  characterName: string;
  type: 'PLAYER' | 'ENEMY';
  state: 'ALIVE' | 'DEAD' | 'PERMANENTLY_DEAD';
  currentHP: number;
  maxHP: number;
  armorClass: number;
  attributes: CombatAttributes;
  equipment: CombatEquipment[];
  reviveAttempts: number;
  maxReviveAttempts: number;
  initiativeRoll?: number;
  hasRolledInitiative: boolean;
};

// Atributos para combate
type CombatAttributes = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  attackBonus: number;
  damageBonus: number;
  initiativeBonus: number;
};

// Equipamento de combate
type CombatEquipment = {
  id: string;
  name: string;
  type: 'WEAPON' | 'ARMOR' | 'SHIELD' | 'ACCESSORY';
  attackBonus?: number;
  damageRoll?: string; // ex: "1d8+2"
  armorBonus?: number;
  properties: string[];
};

// Inimigo
type Enemy = {
  id: string;
  name: string;
  type: string;
  currentHP: number;
  maxHP: number;
  armorClass: number;
  attackBonus: number;
  damageRoll: string;
  initiativeBonus: number;
  resistances: DamageType[];
  weaknesses: DamageType[];
  immunities: DamageType[];
  aiPattern: 'RANDOM' | 'WEAKEST' | 'CLOSEST' | 'STRONGEST';
};

// Entrada da ordem de iniciativa
type InitiativeEntry = {
  combatantId: string;
  combatantName: string;
  combatantType: 'PLAYER' | 'ENEMY';
  initiativeRoll: number;
  modifiers: number;
  totalInitiative: number;
  position: number;
};

// Turno atual
type CombatTurn = {
  combatantId: string;
  combatantName: string;
  combatantType: 'PLAYER' | 'ENEMY';
  turnNumber: number;
  roundNumber: number;
  timeRemaining: number;
  canSelectTarget: boolean;
  availableTargets: string[];
  hasActed: boolean;
};

// Resultado de ataque
type AttackResult = {
  attackerId: string;
  targetId: string;
  attackRoll: number;
  modifiers: number;
  totalAttack: number;
  targetAC: number;
  result: 'MISS' | 'HIT' | 'CRITICAL_HIT' | 'CRITICAL_MISS';
  damageRolled: boolean;
};

// Resultado de dano
type DamageResult = {
  baseDamage: number;
  modifiers: number;
  criticalMultiplier: number;
  resistanceMultiplier: number;
  finalDamage: number;
  damageType: DamageType;
  target: {
    id: string;
    previousHP: number;
    newHP: number;
    isDead: boolean;
  };
};

// Resultado de ressurreição
type ReviveResult = {
  characterId: string;
  dice1: number;
  dice2: number;
  success: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  newHP?: number;
  isPermanentlyDead: boolean;
};

// Recompensas de combate
type CombatRewards = {
  victory: boolean;
  xpGained: number;
  xpPerParticipant: number;
  hpRecovered: number;
  itemsFound: CombatItem[];
  goldGained: number;
  combatDuration: number;
  roundsCompleted: number;
};

// Estatísticas do participante
type ParticipantStats = {
  characterId: string;
  characterName: string;
  finalState: 'ALIVE' | 'DEAD' | 'PERMANENTLY_DEAD';
  damageDealt: number;
  damageTaken: number;
  attacksAttempted: number;
  attacksHit: number;
  criticalHits: number;
  criticalMisses: number;
  reviveAttempts: number;
  survivedCombat: boolean;
};

// Ação do inimigo
type EnemyAction = {
  enemyId: string;
  enemyName: string;
  action: 'ATTACK' | 'DEFEND' | 'SPECIAL_ABILITY';
  targetId: string;
  targetName: string;
  reasoning: string; // ex: "Escolheu alvo mais fraco"
};

// Animação de dados
type DiceAnimation = {
  diceType: 'D20' | 'D10' | 'D8' | 'D6' | 'D4';
  diceCount: number;
  results: number[];
  animationDuration: number;
  finalResult: number;
};

// Atualização de combate
type CombatUpdate = {
  id: string;
  type: 'INITIATIVE_ROLLED' | 'TURN_STARTED' | 'ATTACK_MADE' | 'DAMAGE_DEALT' | 'CHARACTER_DIED' | 'REVIVE_ATTEMPTED' | 'COMBAT_ENDED';
  timestamp: Date;
  sessionId: string;
  data: {
    // Para INITIATIVE_ROLLED
    characterName?: string;
    initiativeRoll?: number;
    position?: number;

    // Para TURN_STARTED
    currentTurn?: CombatTurn;

    // Para ATTACK_MADE
    attackResult?: AttackResult;

    // Para DAMAGE_DEALT
    damageResult?: DamageResult;

    // Para CHARACTER_DIED
    characterDied?: {
      id: string;
      name: string;
      canRevive: boolean;
    };

    // Para REVIVE_ATTEMPTED
    reviveResult?: ReviveResult;

    // Para COMBAT_ENDED
    combatRewards?: CombatRewards;
  };
};

// Item encontrado no combate
type CombatItem = {
  id: string;
  name: string;
  type: 'WEAPON' | 'ARMOR' | 'POTION' | 'TREASURE';
  description: string;
  value: number;
};

// Tipos de dano
type DamageType = 'PHYSICAL' | 'FIRE' | 'COLD' | 'LIGHTNING' | 'POISON' | 'NECROTIC' | 'RADIANT' | 'FORCE';
```

### Tipos Específicos para Tela de Jogo
```javascript
// Estado completo da tela de jogo
type GameScreenState = {
  sessionId: string;
  sessionName: string;
  currentChapter: Chapter;
  votingState: VotingState;
  playerCount: number;
  gameProgress: {
    currentChapterIndex: number;
    totalChapters: number;
    completionPercentage: number;
  };
};

// Timeline da narrativa
type TimelineData = {
  currentEntry: TimelineEntry;
  previousEntries: TimelineEntry[];
  hasNextChapter: boolean;
};

type TimelineEntry = {
  id: string;
  chapterTitle: string;
  text: string;
  timestamp: Date;
  type: 'STORY' | 'CHOICE_RESULT' | 'SYSTEM_MESSAGE';
  metadata?: {
    choicesMade: string;
    votingResult: string;
  };
};

// Tile de jogador
type PlayerTile = {
  userId: string;
  characterId: string;
  characterName: string;
  miniDescription: string;
  race: string;
  class: string;
  isOnline: boolean;
  lastActivity: Date;
  hasVoted: boolean;
  currentVote?: string;
  profileImage?: string;
};

// Ficha completa de personagem
type FullCharacterSheet = {
  basic: {
    name: string;
    race: string;
    class: string;
    level: number;
  };
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  background: {
    story: string;
    appearance: string;
    personality: string;
    fears: string;
    goals: string;
  };
  equipment: string[];
  gameStats: {
    totalVotes: number;
    decisionsInfluenced: number;
    sessionJoinDate: Date;
  };
};

// Estado de votação
type VotingState = {
  isActive: boolean;
  options: VotingOption[];
  votes: PlayerVote[];
  timer: VotingTimer;
  canVote: boolean;
  hasVoted: boolean;
  currentPlayerVote?: string;
};

type VotingOption = {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  isWinning: boolean;
};

type PlayerVote = {
  characterId: string;
  characterName: string;
  optionId: string;
  timestamp: Date;
};

// Timer de votação
type VotingTimer = {
  isActive: boolean;
  timeRemaining: number; // em segundos
  totalTime: number; // tempo total configurado
  startedAt: Date;
  endsAt: Date;
  autoFinishEnabled: boolean;
};

// Resultado de votação
type VotingResult = {
  winningOption: {
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
  };
  allVotes: {
    optionId: string;
    count: number;
    percentage: number;
  }[];
  participantCount: number;
  decisionMethod: 'UNANIMOUS' | 'MAJORITY' | 'TIMEOUT';
  completedAt: Date;
};

// Estado do chat na tela de jogo
type ChatState = {
  messages: GameChatMessage[];
  playerCount: number;
  isActive: boolean;
  lastMessageId: string;
};

type GameChatMessage = {
  id: string;
  characterId: string;
  characterName: string;
  message: string;
  timestamp: Date;
  type: 'PLAYER' | 'SYSTEM' | 'VOTING_UPDATE';
};

// Atualizações específicas da tela de jogo
type GameUpdate = {
  id: string;
  type: 'VOTE_RECEIVED' | 'TIMER_STARTED' | 'TIMER_UPDATE' | 'VOTING_COMPLETED' | 'CHAPTER_CHANGED' | 'PLAYER_STATUS_CHANGED' | 'CHAT_MESSAGE';
  timestamp: Date;
  sessionId: string;
  data: {
    // Para VOTE_RECEIVED
    characterName?: string;
    optionChosen?: string;
    votesRemaining?: number;

    // Para TIMER_UPDATE
    timeRemaining?: number;

    // Para VOTING_COMPLETED
    result?: VotingResult;

    // Para CHAPTER_CHANGED
    newChapter?: Chapter;

    // Para PLAYER_STATUS_CHANGED
    playerUpdates?: PlayerStatusUpdate[];

    // Para CHAT_MESSAGE
    message?: GameChatMessage;
  };
};

type PlayerStatusUpdate = {
  characterId: string;
  characterName: string;
  isOnline: boolean;
  lastActivity: Date;
};
```

### Chat
```javascript
// Enviar mensagem
sendMessage(sessionId: string, characterId: string, mensagem: string, token: string): Promise<{sucesso: boolean, messageId: string}>

// Obter mensagens desde última consulta
getMessages(sessionId: string, lastMessageId: string, token: string): Promise<{messages: Message[], lastMessageId: string}>

// Obter histórico completo do chat
getChatHistory(sessionId: string, limit: number, token: string): Promise<{messages: Message[]}>
```

### Histórias (Admin)
```javascript
// Criar história a partir de Mermaid com metadados completos
createStoryFromMermaid(mermaidCode: string, metadata: StoryMetadata, token: string): Promise<{story: StoryWithMetadata}>

// Upload de arquivo Mermaid
uploadMermaidFile(fileContent: string, metadata: StoryMetadata, token: string): Promise<{story: StoryWithMetadata}>

// Listar todas as histórias (admin)
listAllStories(token: string): Promise<{stories: StoryWithMetadata[]}>

// Obter catálogo público de histórias
getPublicStoryCatalog(token: string): Promise<{stories: PublicStoryInfo[]}>

// Atualizar história e metadados
updateStory(storyId: string, updates: Partial<StoryWithMetadata>, token: string): Promise<{story: StoryWithMetadata}>

// Ativar/desativar história
toggleStoryStatus(storyId: string, isActive: boolean, token: string): Promise<{sucesso: boolean, newStatus: boolean}>

// Excluir história
deleteStory(storyId: string, token: string): Promise<{sucesso: boolean}>

// Validar código Mermaid
validateMermaidCode(mermaidCode: string, token: string): Promise<{valid: boolean, parsedStructure?: any, erro?: string}>

// Obter estatísticas de uso de história
getStoryUsageStats(storyId: string, token: string): Promise<{stats: StoryUsageStats}>
```

### Sistema de Estados e Validação
```javascript
// Obter opções de raças e classes disponíveis
getCharacterOptions(token: string): Promise<{races: Race[], classes: Class[]}>

// Validar transição de estado de sessão
validateStateTransition(sessionId: string, newState: SessionState, token: string): Promise<{valid: boolean, requirements?: string[]}>

// Obter requisitos para iniciar sessão
getStartRequirements(sessionId: string, token: string): Promise<{canStart: boolean, missingRequirements: string[], participantsReady: boolean}>

// Forçar mudança de estado (admin apenas)
forceStateChange(sessionId: string, newState: SessionState, token: string): Promise<{sucesso: boolean, newState: SessionState}>
```

### Administração
```javascript
// Obter dashboard administrativo (igual ao comum + botão gerenciamento)
getAdminDashboard(token: string): Promise<{hasSessions: boolean, sessionCards?: SessionCard[], actions: string[], showWelcome?: boolean, hasManagementAccess: boolean}>

// Acessar painel de controle de usuários
getManagementPanel(token: string): Promise<{users: UserWithStats[]}>

// Visualizar sessões de um usuário específico
getUserSessions(userId: string, token: string): Promise<{user: User, sessions: SessionWithDetails[]}>

// Obter detalhes completos de uma sessão (admin)
getSessionFullDetails(sessionId: string, token: string): Promise<{session: FullSessionDetails, participants: DnDCharacter[], history: SessionHistory, statistics: SessionStats}>

// Confirmar exclusão de usuário com dialog
confirmDeleteUser(userId: string, token: string): Promise<{confirmation: {message: string, cascadeInfo: {sessionsToDelete: number, charactersToDelete: number}}}>

// Executar exclusão de usuário após confirmação
executeDeleteUser(userId: string, confirmed: boolean, token: string): Promise<{sucesso: boolean, deletedSessions: number, deletedCharacters: number}>

// Confirmar exclusão de sessão com dialog
confirmDeleteSession(sessionId: string, token: string): Promise<{confirmation: {message: string, sessionInfo: {name: string, participantCount: number, status: string}}}>

// Executar exclusão de sessão após confirmação
executeDeleteSession(sessionId: string, confirmed: boolean, token: string): Promise<{sucesso: boolean, removedParticipants: number}>

// Listar todos os usuários com estatísticas
listAllUsersWithStats(token: string): Promise<{users: UserWithStats[]}>

// Listar todas as sessões com filtros
listAllSessionsWithFilters(filters: SessionFilters, token: string): Promise<{sessions: SessionWithDetails[]}>

// Obter estatísticas detalhadas do sistema
getDetailedSystemStats(token: string): Promise<{stats: DetailedSystemStats}>

// Promover usuário para admin
promoteToAdmin(userId: string, token: string): Promise<{sucesso: boolean}>

// Rebaixar admin para usuário
demoteFromAdmin(userId: string, token: string): Promise<{sucesso: boolean}>
```

### Tipos Específicos para Administração
```javascript
// Usuário com estatísticas para painel admin
type UserWithStats = {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  lastLogin?: Date;
  statistics: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalCharacters: number;
  };
};

// Sessão com detalhes para visualização admin
type SessionWithDetails = {
  id: string;
  name: string;
  sessionCode: string;
  storyId: string;
  storyTitle: string;
  ownerId: string;
  ownerUsername: string;
  status: SessionStatus;
  participantCount: number;
  maxPlayers: number;
  currentChapter: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  startedAt?: Date;
  completedAt?: Date;
};

// Detalhes completos de sessão para dialog admin
type FullSessionDetails = {
  session: SessionWithDetails;
  story: {
    title: string;
    genre: string;
    description: string;
    estimatedDuration: string;
  };
  participants: {
    userId: string;
    username: string;
    characterName: string;
    hasCreatedCharacter: boolean;
    joinedAt: Date;
    isOnline: boolean;
  }[];
  progress: {
    currentChapter: string;
    chapterTitle: string;
    totalVotes: number;
    pendingVotes: number;
    chaptersCompleted: number;
  };
  timestamps: {
    created: Date;
    started?: Date;
    lastActivity: Date;
    completed?: Date;
  };
};

// Estatísticas detalhadas do sistema
type DetailedSystemStats = {
  users: {
    total: number;
    admins: number;
    activeToday: number;
    newThisWeek: number;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    averageDuration: number;
    mostPopularStory: string;
  };
  stories: {
    total: number;
    active: number;
    mostUsed: {
      title: string;
      usageCount: number;
    };
  };
  system: {
    uptime: number;
    totalGameHours: number;
    averagePlayersPerSession: number;
  };
};
```

## 7.2 Tipos de Atualizações (Retornadas via checkUpdates)

```javascript
// Tipos de atualizações que podem ser retornadas
type Update = {
  id: string;
  type: 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'CHARACTER_CREATED' | 'CHARACTER_UPDATED' | 'ALL_CHARACTERS_READY' | 'SESSION_STATE_CHANGED' | 'VOTE_RECEIVED' | 'CHAPTER_CHANGED' | 'STORY_ENDED' | 'NEW_MESSAGE' | 'SESSION_DELETED' | 'GAME_STARTED';
  timestamp: Date;
  sessionId: string;
  data: any;
};

// Exemplos de atualizações expandidas
{
  updates: [
    {
      id: 'update_123',
      type: 'PLAYER_JOINED',
      timestamp: '2025-09-26T10:30:00Z',
      sessionId: 'session_789',
      data: { userId: 'user_123', username: 'jogador1' }
    },
    {
      id: 'update_124',
      type: 'CHARACTER_CREATED',
      timestamp: '2025-09-26T10:31:00Z',
      sessionId: 'session_789',
      data: {
        characterId: 'char_456',
        characterName: 'Aragorn',
        userId: 'user_123',
        isComplete: true
      }
    },
    {
      id: 'update_125',
      type: 'ALL_CHARACTERS_READY',
      timestamp: '2025-09-26T10:32:00Z',
      sessionId: 'session_789',
      data: { canStart: true, participantCount: 3 }
    },
    {
      id: 'update_126',
      type: 'SESSION_STATE_CHANGED',
      timestamp: '2025-09-26T10:33:00Z',
      sessionId: 'session_789',
      data: {
        oldState: 'CREATING_CHARACTERS',
        newState: 'IN_PROGRESS',
        isLocked: true
      }
    },
    {
      id: 'update_127',
      type: 'GAME_STARTED',
      timestamp: '2025-09-26T10:34:00Z',
      sessionId: 'session_789',
      data: { redirectTo: 'gameScreen', chapter: 'inicio' }
    },
    {
      id: 'update_128',
      type: 'NEW_MESSAGE',
      timestamp: '2025-09-26T10:35:00Z',
      sessionId: 'session_789',
      data: { messageId: 'msg_456', characterName: 'Aragorn', mensagem: 'Vamos entrar na caverna!' }
    },
    {
      id: 'update_125',
      type: 'VOTE_RECEIVED',
      timestamp: '2025-09-26T10:32:00Z',
      sessionId: 'session_789',
      data: { characterId: 'char_456', opcaoId: 'entrar', pendingVotes: 2 }
    },
    {
      id: 'update_126',
      type: 'CHAPTER_CHANGED',
      timestamp: '2025-09-26T10:33:00Z',
      sessionId: 'session_789',
      data: { newChapter: { id: 'dentro-caverna', texto: '...', opcoes: [...] } }
    }
  ],
  lastUpdateId: 'update_126'
}
```

## 7.3 Documentação Swagger

Todas as APIs RPC serão documentadas automaticamente com Swagger/OpenAPI:

```yaml
# Exemplo de documentação Swagger para um endpoint
/rpc/login:
  post:
    summary: Autentica usuário e retorna JWT token
    tags:
      - Authentication
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
                example: "jogador1"
              password:
                type: string
                format: password
                example: "senha123"
            required:
              - username
              - password
    responses:
      200:
        description: Login bem-sucedido
        content:
          application/json:
            schema:
              type: object
              properties:
                token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                user:
                  $ref: '#/components/schemas/User'
                expiresIn:
                  type: number
                  example: 3600
      401:
        description: Credenciais inválidas
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        role:
          type: string
          enum: [USER, ADMIN]
        createdAt:
          type: string
          format: date-time

    Character:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        userId:
          type: string
        sessionId:
          type: string
        createdAt:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        message:
          type: string
        code:
          type: string
        details:
          type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

---

[← Anterior: Fluxos](./06-fluxos.md) | [Voltar ao Menu](./README.md) | [Próximo: Validação Zod →](./08-validacao-zod.md)