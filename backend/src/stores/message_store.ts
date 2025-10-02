import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Message } from '../models/chat_schemas.js';

const MESSAGES_FILE = join(process.cwd(), 'data', 'messages.json');

interface MessagesData {
  messages: Message[];
}

export class MessageStore {
  private data: MessagesData;

  constructor() {
    this.data = this.load();
  }

  private load(): MessagesData {
    try {
      const raw = readFileSync(MESSAGES_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (error) {
      return { messages: [] };
    }
  }

  private save(): void {
    writeFileSync(MESSAGES_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async addMessage(message: Message): Promise<Message> {
    this.data.messages.push(message);
    this.save();
    return message;
  }

  async getMessagesBySession(
    sessionId: string,
    options?: {
      limit?: number;
      since?: string;
    }
  ): Promise<Message[]> {
    let messages = this.data.messages.filter(
      (msg) => msg.sessionId === sessionId
    );

    if (options?.since) {
      const sinceIndex = messages.findIndex((msg) => msg.id === options.since);
      if (sinceIndex !== -1) {
        messages = messages.slice(sinceIndex + 1);
      }
    }

    messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return this.data.messages.find((msg) => msg.id === messageId) || null;
  }

  async countMessagesBySession(sessionId: string): Promise<number> {
    return this.data.messages.filter((msg) => msg.sessionId === sessionId)
      .length;
  }

  async addSystemMessage(
    sessionId: string,
    message: string,
    messageId?: string
  ): Promise<Message> {
    const systemMessage: Message = {
      id: messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId,
      message,
      type: 'SYSTEM',
      timestamp: new Date().toISOString(),
    };

    return this.addMessage(systemMessage);
  }

  async deleteMessagesBySession(sessionId: string): Promise<void> {
    this.data.messages = this.data.messages.filter(
      (msg) => msg.sessionId !== sessionId
    );
    this.save();
  }
}
