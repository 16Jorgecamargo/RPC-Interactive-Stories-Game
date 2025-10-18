import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import * as sessionStore from '../stores/session_store.js';
import * as storyStore from '../stores/story_store.js';
import * as characterStore from '../stores/character_store.js';
import * as userStore from '../stores/user_store.js';
import * as gameService from './game_service.js';
import * as eventStore from '../stores/event_store.js';
import * as messageStore from '../stores/message_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import { logInfo, logWarning } from '../utils/logger.js';
import type { GameUpdate } from '../models/update_schemas.js';
import type { Message } from '../models/chat_schemas.js';
import type {
  CreateSession,
  JoinSession,
  GetSessions,
  GetSessionDetails,
  DeleteSession,
  LeaveSession,
  Session,
  Participant,
  CreateSessionResponse,
  JoinSessionResponse,
  SessionsList,
  SessionDetailsResponse,
  DeleteSessionResponse,
  LeaveSessionResponse,
  TransitionToCreatingCharacters,
  CanStartSession,
  StartSession,
  TransitionResponse,
  CanStartResponse,
  StartSessionResponse,
} from '../models/session_schemas.js';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (sessionStore.sessionCodeExists(code)) {
    return generateSessionCode();
  }

  return code;
}

export async function createSession(params: CreateSession): Promise<CreateSessionResponse> {
  const { token, name, storyId, maxPlayers, votingTimeoutSeconds, tieResolutionStrategy } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const story = storyStore.findById(storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId },
    };
  }

  if (!story.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não está ativa',
      data: { storyId },
    };
  }

  const sessionCode = generateSessionCode();
  const now = new Date().toISOString();

  const ownerParticipant: Participant = {
    userId,
    hasCreatedCharacter: false,
    isOnline: true,
    joinedAt: now,
    lastActivity: now,
  };

  const session: Session = {
    id: `session_${uuidv4()}`,
    name,
    sessionCode,
    storyId,
    ownerId: userId,
    status: 'WAITING_PLAYERS',
    participants: [ownerParticipant],
    maxPlayers,
    isLocked: false,
    currentChapter: story.initialChapter,
    createdAt: now,
    updatedAt: now,
    tieResolutionStrategy: tieResolutionStrategy || 'RANDOM',
    votingTimer: votingTimeoutSeconds
      ? {
          durationSeconds: votingTimeoutSeconds,
          isActive: false,
          extensionsUsed: 0,
        }
      : undefined,
  };

  const createdSession = sessionStore.createSession(session);

  logInfo('[SESSION] Sessão criada', { 
    sessionId: createdSession.id, 
    sessionCode: createdSession.sessionCode,
    ownerId: userId, 
    storyId,
    name
  });

  return {
    session: createdSession,
    message: 'Sessão criada com sucesso',
  };
}

export async function joinSession(params: JoinSession): Promise<JoinSessionResponse> {
  const { token, sessionCode } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findByCode(sessionCode);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionCode },
    };
  }

  if (session.isLocked) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão bloqueada para novos participantes',
      data: { reason: 'A partida já começou' },
    };
  }

  if (session.status !== 'WAITING_PLAYERS' && session.status !== 'CREATING_CHARACTERS') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não é possível entrar nesta sessão',
      data: { reason: 'A sessão já está em andamento ou finalizada' },
    };
  }

  const isAlreadyParticipant = session.participants.some((p) => p.userId === userId);
  if (isAlreadyParticipant) {
    const now = new Date().toISOString();
    const updatedParticipants = session.participants.map((p) =>
      p.userId === userId
        ? { ...p, isOnline: true, lastActivity: now }
        : p
    );
    
    const updatedSession = sessionStore.updateSession(session.id, {
      participants: updatedParticipants,
    });

    if (!updatedSession) {
      throw {
        ...JSON_RPC_ERRORS.INTERNAL_ERROR,
        message: 'Erro ao atualizar status online',
      };
    }

    const story = storyStore.findById(session.storyId);
    const owner = userStore.findById(session.ownerId);
    const myParticipant = updatedSession.participants.find((p) => p.userId === userId);
    let myCharacterName = null;

    if (myParticipant?.characterId) {
      const character = characterStore.findById(myParticipant.characterId);
      myCharacterName = character?.name || null;
    }

    return {
      session: {
        ...updatedSession,
        storyTitle: story?.title || 'História não encontrada',
        storyGenre: story?.metadata.genre || 'Desconhecido',
        storySynopsis: story?.metadata.synopsis || null,
        myCharacterName,
        ownerUsername: owner?.username || 'Desconhecido',
      },
      message: 'Você já está nesta sessão',
    };
  }

  if (session.participants.length >= session.maxPlayers) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão lotada',
      data: {
        maxPlayers: session.maxPlayers,
        currentPlayers: session.participants.length,
      },
    };
  }

  const now = new Date().toISOString();
  const newParticipant: Participant = {
    userId,
    hasCreatedCharacter: false,
    isOnline: true,
    joinedAt: now,
    lastActivity: now,
  };

  const updatedParticipants = [...session.participants, newParticipant];
  const updatedSession = sessionStore.updateSession(session.id, {
    participants: updatedParticipants,
  });

  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao entrar na sessão',
    };
  }

  const joinUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'PLAYER_SESSION_JOINED',
    timestamp: now,
    sessionId: session.id,
    data: {
      userId,
      username: decoded.username,
    },
  };
  eventStore.addUpdate(joinUpdate);

  logInfo('[SESSION] Jogador entrou na sessão', {
    sessionId: session.id,
    sessionCode: session.sessionCode,
    userId,
    username: decoded.username,
    totalParticipants: updatedParticipants.length
  });

  const story = storyStore.findById(session.storyId);
  const owner = userStore.findById(session.ownerId);
  const myParticipant = updatedSession.participants.find((p) => p.userId === userId);
  let myCharacterName = null;

  if (myParticipant?.characterId) {
    const character = characterStore.findById(myParticipant.characterId);
    myCharacterName = character?.name || null;
  }

  return {
    session: {
      ...updatedSession,
      storyTitle: story?.title || 'História não encontrada',
      storyGenre: story?.metadata.genre || 'Desconhecido',
      storySynopsis: story?.metadata.synopsis || null,
      myCharacterName,
      ownerUsername: owner?.username || 'Desconhecido',
    },
    message: 'Você entrou na sessão com sucesso',
  };
}

export async function listMySessions(params: GetSessions): Promise<SessionsList> {
  const { token } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const sessions = sessionStore.findByUserId(userId);

  const sessionsWithStory = sessions.map((session) => {
    const story = storyStore.findById(session.storyId);
    const owner = userStore.findById(session.ownerId);

    const myParticipant = session.participants.find((p) => p.userId === userId);
    let myCharacterName = null;

    if (myParticipant?.characterId) {
      const character = characterStore.findById(myParticipant.characterId);
      myCharacterName = character?.name || null;
    }

    // Contar jogadores online
    const onlineCount = session.participants.filter((p) => p.isOnline).length;

    return {
      ...session,
      storyTitle: story?.title || 'História não encontrada',
      storyGenre: story?.metadata.genre || 'Desconhecido',
      storySynopsis: story?.metadata.synopsis || null,
      myCharacterName,
      ownerUsername: owner?.username || 'Desconhecido',
      onlineCount,
    };
  });

  sessionsWithStory.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return {
    sessions: sessionsWithStory,
    total: sessionsWithStory.length,
  };
}

export async function getSessionDetails(params: GetSessionDetails): Promise<SessionDetailsResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
    };
  }

  const now = new Date().toISOString();
  const updatedParticipants = session.participants.map((p) =>
    p.userId === userId
      ? { ...p, isOnline: true, lastActivity: now }
      : p
  );
  
  const updatedSession = sessionStore.updateSession(sessionId, {
    participants: updatedParticipants,
  });

  const story = storyStore.findById(session.storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História da sessão não encontrada',
      data: { storyId: session.storyId },
    };
  }

  const sessionToReturn = updatedSession || session;
  
  const enrichedParticipants = sessionToReturn.participants.map((p) => {
    const user = userStore.findById(p.userId);
    let characterName: string | undefined = undefined;
    
    if (p.characterId) {
      const character = characterStore.findById(p.characterId);
      characterName = character?.name || undefined;
    }
    
    return {
      ...p,
      username: user?.username || 'Desconhecido',
      characterName,
    };
  });

  return {
    session: {
      ...sessionToReturn,
      participants: enrichedParticipants,
    },
    story: {
      id: story.id,
      title: story.title,
      description: story.description,
      genre: story.metadata.genre,
      difficulty: story.metadata.difficulty,
      estimatedDuration: story.metadata.estimatedDuration,
    },
  };
}

export async function deleteSession(params: DeleteSession): Promise<DeleteSessionResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  if (session.ownerId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Apenas o criador da sessão pode excluí-la',
    };
  }

  const deleted = sessionStore.deleteSession(sessionId);
  if (!deleted) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao excluir sessão',
    };
  }

  return {
    success: true,
    message: 'Sessão excluída com sucesso',
  };
}

export async function leaveSession(params: LeaveSession): Promise<LeaveSessionResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  if (session.ownerId === userId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'O criador não pode sair da sessão, apenas excluí-la',
      data: { hint: 'Use deleteSession ao invés de leaveSession' },
    };
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Você não está nesta sessão',
    };
  }

  const updatedParticipants = session.participants.filter((p) => p.userId !== userId);
  const updatedSession = sessionStore.updateSession(sessionId, {
    participants: updatedParticipants,
  });

  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao sair da sessão',
    };
  }

  const now = new Date().toISOString();
  
  const leaveUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'PLAYER_SESSION_LEFT',
    timestamp: now,
    sessionId: session.id,
    data: {
      userId,
      username: decoded.username,
    },
  };
  eventStore.addUpdate(leaveUpdate);

  return {
    success: true,
    message: 'Você saiu da sessão',
  };
}

export async function transitionToCreatingCharacters(
  params: TransitionToCreatingCharacters,
): Promise<TransitionResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  if (session.ownerId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Apenas o criador da sessão pode alterar seu estado',
    };
  }

  if (session.status !== 'WAITING_PLAYERS') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Transição de estado inválida',
      data: {
        currentState: session.status,
        allowedState: 'WAITING_PLAYERS',
      },
    };
  }

  if (session.participants.length < 1) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'É necessário pelo menos 1 participante para iniciar a criação de personagens',
      data: { currentParticipants: session.participants.length },
    };
  }

  const updatedSession = sessionStore.updateSession(sessionId, {
    status: 'CREATING_CHARACTERS',
  });

  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao atualizar estado da sessão',
    };
  }

  const stateChangeUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'SESSION_STATE_CHANGED',
    timestamp: new Date().toISOString(),
    sessionId: session.id,
    data: {
      oldState: 'WAITING_PLAYERS',
      newState: 'CREATING_CHARACTERS',
      isLocked: false,
    },
  };
  eventStore.addUpdate(stateChangeUpdate);

  return {
    session: updatedSession,
    message: 'Todos os jogadores devem criar seus personagens agora',
  };
}

export async function canStartSession(params: CanStartSession): Promise<CanStartResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
    };
  }

  const missingRequirements: string[] = [];

  if (session.status !== 'CREATING_CHARACTERS') {
    missingRequirements.push(
      `Status da sessão deve ser CREATING_CHARACTERS (atual: ${session.status})`,
    );
  }

  const participantsWithCharacters = session.participants.filter((p) => p.hasCreatedCharacter);
  const allHaveCharacters = participantsWithCharacters.length === session.participants.length;

  if (!allHaveCharacters) {
    const participantsWithoutCharacters = session.participants.filter(
      (p) => !p.hasCreatedCharacter,
    );
    missingRequirements.push(
      `${participantsWithoutCharacters.length} participante(s) ainda não criaram personagens`,
    );
  }

  const canStart = missingRequirements.length === 0;

  return {
    canStart,
    missingRequirements,
    participantsReady: participantsWithCharacters.length,
    totalParticipants: session.participants.length,
  };
}

export async function startSession(params: StartSession): Promise<StartSessionResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  if (session.ownerId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Apenas o criador da sessão pode iniciá-la',
    };
  }

  if (session.status !== 'CREATING_CHARACTERS') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão deve estar no estado CREATING_CHARACTERS para ser iniciada',
      data: { currentStatus: session.status },
    };
  }

  const allHaveCharacters = session.participants.every((p) => p.hasCreatedCharacter);
  if (!allHaveCharacters) {
    const participantsWithoutCharacters = session.participants.filter(
      (p) => !p.hasCreatedCharacter,
    );
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Todos os participantes devem criar seus personagens antes de iniciar',
      data: {
        missingCharacters: participantsWithoutCharacters.length,
        total: session.participants.length,
      },
    };
  }

  const now = new Date().toISOString();
  const updatedSession = sessionStore.updateSession(sessionId, {
    status: 'IN_PROGRESS',
    isLocked: true,
    startedAt: now,
  });

  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao iniciar sessão',
    };
  }

  await gameService.createInitialTimelineEntry(sessionId, session.storyId);

  const stateChangeUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'SESSION_STATE_CHANGED',
    timestamp: now,
    sessionId: session.id,
    data: {
      oldState: 'CREATING_CHARACTERS',
      newState: 'IN_PROGRESS',
      isLocked: true,
    },
  };
  eventStore.addUpdate(stateChangeUpdate);

  const gameStartUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'GAME_STARTED',
    timestamp: now,
    sessionId: session.id,
    data: {
      redirectTo: 'gameScreen',
      chapter: session.currentChapter,
    },
  };
  eventStore.addUpdate(gameStartUpdate);

  return {
    session: updatedSession,
    message: 'Sessão iniciada! A aventura começa agora.',
  };
}

export async function enterRoom(params: {
  token: string;
  sessionId: string;
}): Promise<{ success: boolean; message: string }> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não participa desta sessão',
      data: { sessionId, userId },
    };
  }

  // Marca como online e atualiza lastActivity
  const now = new Date().toISOString();
  const wasOffline = !participant.isOnline;
  
  participant.isOnline = true;
  participant.lastActivity = now;

  await sessionStore.updateSession(session.id, {
    participants: session.participants,
  });

  // Envia evento PLAYER_ROOM_JOINED
  const roomJoinUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'PLAYER_ROOM_JOINED',
    timestamp: now,
    sessionId: session.id,
    data: {
      userId,
      username: decoded.username,
      wasOffline,
    },
  };
  eventStore.addUpdate(roomJoinUpdate);

  logInfo('[SESSION] Jogador entrou na sala de espera', {
    sessionId: session.id,
    userId,
    username: decoded.username,
    wasOffline,
  });

  return {
    success: true,
    message: 'Você entrou na sala',
  };
}

export async function leaveRoom(params: {
  token: string;
  sessionId: string;
}): Promise<{ success: boolean; message: string }> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não participa desta sessão',
      data: { sessionId, userId },
    };
  }

  // Marca como offline
  const now = new Date().toISOString();
  participant.isOnline = false;
  participant.lastActivity = now;

  await sessionStore.updateSession(session.id, {
    participants: session.participants,
  });

  // Envia evento PLAYER_ROOM_LEFT
  const roomLeaveUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'PLAYER_ROOM_LEFT',
    timestamp: now,
    sessionId: session.id,
    data: {
      userId,
      username: decoded.username,
      reason: 'voluntary',
    },
  };
  eventStore.addUpdate(roomLeaveUpdate);

  logInfo('[SESSION] Jogador saiu da sala de espera', {
    sessionId: session.id,
    userId,
    username: decoded.username,
  });

  return {
    success: true,
    message: 'Você voltou para a taverna',
  };
}
