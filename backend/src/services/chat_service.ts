import * as messageStore from '../stores/message_store.js';
import { findById as findSessionById } from '../stores/session_store.js';
import { findById as findCharacterById } from '../stores/character_store.js';
import * as eventStore from '../stores/event_store.js';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import {
  Message,
  SendMessageParams,
  GetMessagesParams,
  SendMessageResponse,
  GetMessagesResponse,
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

    const sanitizedMessage = sanitizeMessage(message);

    const now = new Date().toISOString();
    const newMessage: Message = {
      id: uuidv4(),
      sessionId,
      characterId,
      characterName: character.name,
      message: sanitizedMessage,
      type: 'PLAYER',
      timestamp: now,
    };

    await messageStore.addMessage(newMessage);

    const messageUpdate: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'NEW_MESSAGE',
      timestamp: now,
      sessionId,
      data: {
        messageId: newMessage.id,
        characterName: character.name,
        mensagem: sanitizedMessage,
      },
    };
    eventStore.addUpdate(messageUpdate);

    return {
      success: true,
      message: newMessage,
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
    message: `${characterName} ${action}`,
    type: 'VOTING_UPDATE',
    timestamp: new Date().toISOString(),
  };

  return messageStore.addMessage(votingMessage);
}
