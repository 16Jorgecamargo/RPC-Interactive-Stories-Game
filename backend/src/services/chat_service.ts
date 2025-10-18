import * as messageStore from '../stores/message_store.js';
import { findById as findSessionById } from '../stores/session_store.js';
import { findById as findCharacterById } from '../stores/character_store.js';
import * as eventStore from '../stores/event_store.js';
import * as roomMessageStore from '../stores/room_message_store.js';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import {
  Message,
  SendMessageParams,
  GetMessagesParams,
  SendMessageResponse,
  GetMessagesResponse,
  SendRoomMessageParams,
  SendRoomMessageResponse,
  GetRoomMessagesParams,
} from '../models/chat_schemas.js';
import { v4 as uuidv4 } from 'uuid';
import type { GameUpdate } from '../models/update_schemas.js';

function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export async function sendMessage(
  params: SendMessageParams
): Promise<SendMessageResponse> {
  const { token, sessionId, characterId, message } = params;

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const session = findSessionById(sessionId);
    if (!session) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Sessão não encontrada',
        data: { sessionId },
      };
    }

    if (session.status === 'COMPLETED') {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Não é possível enviar mensagens em sessões finalizadas',
        data: { sessionId, status: session.status },
      };
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      throw {
        ...JSON_RPC_ERRORS.FORBIDDEN,
        message: 'Você não participa desta sessão',
        data: { sessionId, userId },
      };
    }

    const sanitizedMessage = sanitizeMessage(message);
    const now = new Date().toISOString();
    
    let characterName: string | undefined;
    let finalCharacterId: string | undefined;

    if (characterId) {
      const character = findCharacterById(characterId);
      if (!character) {
        throw {
          ...JSON_RPC_ERRORS.SERVER_ERROR,
          message: 'Personagem não encontrado',
          data: { characterId },
        };
      }

      if (character.userId !== userId) {
        throw {
          ...JSON_RPC_ERRORS.FORBIDDEN,
          message: 'Personagem não pertence a você',
          data: { characterId, userId },
        };
      }

      if (character.sessionId !== sessionId) {
        throw {
          ...JSON_RPC_ERRORS.SERVER_ERROR,
          message: 'Personagem não pertence a esta sessão',
          data: { characterId, sessionId },
        };
      }

      characterName = character.name;
      finalCharacterId = characterId;
    }

    const { findById: findUserById } = await import('../stores/user_store.js');
    const user = findUserById(userId);
    const username = user?.username || 'Jogador';

    const messageId = uuidv4();

    // NÃO persiste mais - apenas faz broadcast via GameUpdate
    const chatBroadcast: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'CHAT_MESSAGE',
      timestamp: now,
      sessionId,
      data: {
        id: messageId,
        userId,
        username,
        characterId: finalCharacterId,
        characterName,
        message: sanitizedMessage,
        type: 'PLAYER',
        timestamp: now,
      },
    };
    eventStore.addUpdate(chatBroadcast);

    return {
      success: true,
      message: {
        id: messageId,
        sessionId,
        userId,
        username,
        characterId: finalCharacterId,
        characterName,
        message: sanitizedMessage,
        type: 'PLAYER',
        timestamp: now,
      },
    };
}

export async function getMessages(
  params: GetMessagesParams
): Promise<GetMessagesResponse> {
  const { token, sessionId, limit = 50, since } = params;

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const session = findSessionById(sessionId);
    if (!session) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Sessão não encontrada',
        data: { sessionId },
      };
    }

    const isParticipant = session.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw {
        ...JSON_RPC_ERRORS.FORBIDDEN,
        message: 'Você não participa desta sessão',
        data: { sessionId, userId },
      };
    }

    const messages = await messageStore.getMessagesBySession(sessionId, {
      limit,
      since,
    });

    const total = await messageStore.countMessagesBySession(sessionId);

    return {
      success: true,
      messages,
      total,
    };
}

export async function addSystemMessage(
  sessionId: string,
  msg: string
): Promise<Message> {
  const session = findSessionById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  return messageStore.addSystemMessage(sessionId, msg);
}

export async function addVotingUpdateMessage(
  sessionId: string,
  characterName: string,
  action: string
): Promise<Message> {
  const votingMessage: Message = {
    id: uuidv4(),
    sessionId,
    userId: 'system',
    username: 'Sistema',
    message: `${characterName} ${action}`,
    type: 'VOTING_UPDATE',
    timestamp: new Date().toISOString(),
  };

  return messageStore.addMessage(votingMessage);
}

export async function sendRoomMessage(
  params: SendRoomMessageParams
): Promise<SendRoomMessageResponse> {
  const { token, sessionId, message } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = findSessionById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const participant = session.participants.find(p => p.userId === userId);
  if (!participant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não participa desta sessão',
      data: { sessionId, userId },
    };
  }

  if (!participant.isOnline) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você precisa estar na sala para enviar mensagens',
      data: { sessionId, userId },
    };
  }

  const sanitizedMessage = sanitizeMessage(message);
  const now = new Date().toISOString();

  const { findById: findUserById } = await import('../stores/user_store.js');
  const user = findUserById(userId);
  const username = user?.username || 'Jogador';

  let characterName: string | undefined;
  let characterId: string | undefined;

  if (participant.characterId) {
    const character = findCharacterById(participant.characterId);
    if (character) {
      characterName = character.name;
      characterId = participant.characterId;
    }
  }

  const updateId = `update_${uuidv4()}`;
  const messageId = `msg_${uuidv4()}`;

  const messageData: Message = {
    id: messageId,
    sessionId,
    userId,
    username,
    characterId,
    characterName,
    message: sanitizedMessage,
    type: 'PLAYER',
    timestamp: now,
  };

  roomMessageStore.addRoomMessage(sessionId, messageData);

  const chatBroadcast: GameUpdate = {
    id: updateId,
    type: 'CHAT_MESSAGE',
    timestamp: now,
    sessionId,
    data: messageData,
  };

  eventStore.addUpdate(chatBroadcast);

  return {
    success: true,
    message: 'Mensagem enviada para a sala',
    broadcastId: updateId,
  };
}

export async function getRoomMessages(params: GetRoomMessagesParams): Promise<GetMessagesResponse> {
  const { sessionId, token } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = findSessionById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não participa desta sessão',
      data: { sessionId, userId },
    };
  }

  const messages = roomMessageStore.getRoomMessages(sessionId);

  return {
    success: true,
    messages,
    total: messages.length,
  };
}
