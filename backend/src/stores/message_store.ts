import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Message } from '../models/chat_schemas.js';

const MESSAGES_FILE = join(process.cwd(), 'data', 'messages.json');

interface MessagesData {
  messages: Message[];
}

function loadMessages(): MessagesData {
  try {
    if (!existsSync(MESSAGES_FILE)) {
      return { messages: [] };
    }
    const raw = readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { messages: [] };
  }
}

function saveMessages(data: MessagesData): void {
  writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function addMessage(message: Message): Message {
  const data = loadMessages();
  data.messages.push(message);
  saveMessages(data);
  return message;
}

export function getMessagesBySession(
  sessionId: string,
  options?: {
    limit?: number;
    since?: string;
  }
): Message[] {
  const data = loadMessages();
  let messages = data.messages.filter(
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

export function getMessageById(messageId: string): Message | null {
  const data = loadMessages();
  return data.messages.find((msg) => msg.id === messageId) || null;
}

export function countMessagesBySession(sessionId: string): number {
  const data = loadMessages();
  return data.messages.filter((msg) => msg.sessionId === sessionId).length;
}

export function addSystemMessage(
  sessionId: string,
  message: string,
  messageId?: string
): Message {
  const systemMessage: Message = {
    id: messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sessionId,
    message,
    type: 'SYSTEM',
    timestamp: new Date().toISOString(),
  };

  return addMessage(systemMessage);
}

export function deleteMessagesBySession(sessionId: string): void {
  const data = loadMessages();
  data.messages = data.messages.filter(
    (msg) => msg.sessionId !== sessionId
  );
  saveMessages(data);
}
