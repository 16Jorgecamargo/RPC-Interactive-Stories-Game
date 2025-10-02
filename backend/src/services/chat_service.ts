import { MessageStore } from '../stores/message_store.js';
import { findById as findSessionById } from '../stores/session_store.js';
import { findById as findCharacterById } from '../stores/character_store.js';
import * as eventStore from '../stores/event_store.js';
import {
  Message,
  SendMessageParams,
  GetMessagesParams,
  SendMessageResponse,
  GetMessagesResponse,
} from '../models/chat_schemas.js';
import { v4 as uuidv4 } from 'uuid';
import type { GameUpdate } from '../models/update_schemas.js';

export class ChatService {
  private messageStore: MessageStore;

  constructor() {
    this.messageStore = new MessageStore();
  }

  async sendMessage(
    params: SendMessageParams
  ): Promise<SendMessageResponse> {
    const { sessionId, characterId, message } = params;

    const session = findSessionById(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    if (session.status === 'COMPLETED') {
      throw new Error('Não é possível enviar mensagens em sessões finalizadas');
    }

    const character = findCharacterById(characterId);
    if (!character) {
      throw new Error('Personagem não encontrado');
    }

    if (character.sessionId !== sessionId) {
      throw new Error('Personagem não pertence a esta sessão');
    }

    const sanitizedMessage = this.sanitizeMessage(message);

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

    await this.messageStore.addMessage(newMessage);

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

  async getMessages(
    params: GetMessagesParams
  ): Promise<GetMessagesResponse> {
    const { sessionId, limit = 50, since } = params;

    const session = findSessionById(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const messages = await this.messageStore.getMessagesBySession(sessionId, {
      limit,
      since,
    });

    const total = await this.messageStore.countMessagesBySession(sessionId);

    return {
      success: true,
      messages,
      total,
    };
  }

  async addSystemMessage(
    sessionId: string,
    message: string
  ): Promise<Message> {
    const session = findSessionById(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    return this.messageStore.addSystemMessage(sessionId, message);
  }

  async addVotingUpdateMessage(
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

    return this.messageStore.addMessage(votingMessage);
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
}
