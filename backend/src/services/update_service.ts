import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import * as eventStore from '../stores/event_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as messageStore from '../stores/message_store.js';
import type { Participant } from '../models/session_schemas.js';
import type { GameUpdate } from '../models/update_schemas.js';

export async function checkGameUpdates(params: {
  token: string;
  sessionId: string;
  lastUpdateId?: string;
}) {
  const { token, sessionId, lastUpdateId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some(
    (p: Participant) => p.userId === userId
  );
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { sessionId, userId },
    };
  }

  const updates = eventStore.findUpdatesBySessionId(sessionId, lastUpdateId);

  return {
    updates,
    lastUpdateId: updates.length > 0 ? updates[updates.length - 1].id : lastUpdateId,
    hasMore: false,
  };
}

export async function updatePlayerStatus(params: {
  token: string;
  sessionId: string;
}) {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const participantIndex = session.participants.findIndex(
    (p: Participant) => p.userId === userId
  );

  if (participantIndex === -1) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { sessionId, userId },
    };
  }

  const participant = session.participants[participantIndex];
  const wasOffline = !participant.isOnline;
  const now = new Date().toISOString();

  participant.isOnline = true;
  participant.lastActivity = now;

  await sessionStore.updateSession(session.id, {
    participants: session.participants,
  });

  if (wasOffline) {
    const reconnectUpdate: GameUpdate = {
      id: `update_${crypto.randomUUID()}`,
      type: 'PLAYER_JOINED',
      timestamp: now,
      sessionId: session.id,
      data: {
        userId,
        username: decoded.username,
        reconnected: true,
      },
    };
    eventStore.addUpdate(reconnectUpdate);
  }

  return {
    sucesso: true,
    statusUpdated: wasOffline,
    lastActivity: now,
  };
}

export async function checkMessages(params: {
  token: string;
  sessionId: string;
  lastMessageId?: string;
}) {
  const { token, sessionId, lastMessageId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some(
    (p: Participant) => p.userId === userId
  );
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { sessionId, userId },
    };
  }

  const messages = await messageStore.getMessagesBySession(sessionId, {
    since: lastMessageId,
  });

  return {
    success: true,
    messages,
    total: messages.length,
  };
}
