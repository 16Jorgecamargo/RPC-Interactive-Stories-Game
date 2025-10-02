import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import * as sessionStore from '../stores/session_store.js';
import * as storyStore from '../stores/story_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
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
  const { token, name, storyId, maxPlayers } = params;

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
  };

  const createdSession = sessionStore.createSession(session);

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
    return {
      session,
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

  return {
    session: updatedSession,
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
    return {
      ...session,
      storyTitle: story?.title || 'História não encontrada',
      storyGenre: story?.metadata.genre || 'Desconhecido',
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

  const story = storyStore.findById(session.storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História da sessão não encontrada',
      data: { storyId: session.storyId },
    };
  }

  return {
    session,
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

  return {
    success: true,
    message: 'Você saiu da sessão',
  };
}
