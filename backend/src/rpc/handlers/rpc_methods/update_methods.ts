import { z } from 'zod';
import { verifyToken } from '../../../utils/jwt.js';
import {
  CheckGameUpdatesSchema,
  GameUpdatesResponseSchema,
  UpdatePlayerStatusSchema,
  PlayerStatusResponseSchema,
  CheckMessagesSchema,
  GameUpdate,
} from '../../../models/update_schemas.js';
import * as eventStore from '../../../stores/event_store.js';
import * as sessionStore from '../../../stores/session_store.js';
import type { Participant } from '../../../models/session_schemas.js';

export const updateMethods = {
  checkGameUpdates: async (
    params: z.infer<typeof CheckGameUpdatesSchema>
  ): Promise<z.infer<typeof GameUpdatesResponseSchema>> => {
    const { token, sessionId, lastUpdateId } = params;

    const decoded = verifyToken(token);
    if (!decoded) {
      throw {
        code: -32001,
        message: 'Token inválido ou expirado',
      };
    }

    const session = await sessionStore.findById(sessionId);
    if (!session) {
      throw {
        code: -32001,
        message: 'Sessão não encontrada',
      };
    }

    const isParticipant = session.participants.some(
      (p: Participant) => p.userId === decoded.userId
    );
    if (!isParticipant) {
      throw {
        code: -32002,
        message: 'Você não é participante desta sessão',
      };
    }

    const updates = eventStore.findUpdatesBySessionId(sessionId, lastUpdateId);

    return {
      updates,
      lastUpdateId: updates.length > 0 ? updates[updates.length - 1].id : lastUpdateId,
      hasMore: false,
    };
  },

  updatePlayerStatus: async (
    params: z.infer<typeof UpdatePlayerStatusSchema>
  ): Promise<z.infer<typeof PlayerStatusResponseSchema>> => {
    const { token, sessionId } = params;

    const decoded = verifyToken(token);
    if (!decoded) {
      throw {
        code: -32001,
        message: 'Token inválido ou expirado',
      };
    }

    const session = await sessionStore.findById(sessionId);
    if (!session) {
      throw {
        code: -32001,
        message: 'Sessão não encontrada',
      };
    }

    const participantIndex = session.participants.findIndex(
      (p: Participant) => p.userId === decoded.userId
    );

    if (participantIndex === -1) {
      throw {
        code: -32002,
        message: 'Você não é participante desta sessão',
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
          userId: decoded.userId,
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
  },

  checkMessages: async (
    params: z.infer<typeof CheckMessagesSchema>
  ) => {
    const { token, sessionId, lastMessageId } = params;

    const decoded = verifyToken(token);
    if (!decoded) {
      throw {
        code: -32001,
        message: 'Token inválido ou expirado',
      };
    }

    const session = await sessionStore.findById(sessionId);
    if (!session) {
      throw {
        code: -32001,
        message: 'Sessão não encontrada',
      };
    }

    const isParticipant = session.participants.some(
      (p: Participant) => p.userId === decoded.userId
    );
    if (!isParticipant) {
      throw {
        code: -32002,
        message: 'Você não é participante desta sessão',
      };
    }

    const { MessageStore } = await import('../../../stores/message_store.js');
    const messageStore = new MessageStore();
    const allMessages = await messageStore.getMessagesBySession(sessionId, {
      since: lastMessageId,
    });

    return {
      messages: allMessages,
      hasMore: false,
    };
  },
};
