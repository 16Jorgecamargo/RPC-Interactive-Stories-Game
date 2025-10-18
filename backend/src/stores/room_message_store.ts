import type { Message } from '../models/chat_schemas.js';
import { logInfo } from '../utils/logger.js';

const ROOM_MESSAGES_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface RoomMessageEntry {
  message: Message;
  expiresAt: number;
}

const roomMessagesMap = new Map<string, RoomMessageEntry[]>();

export function addRoomMessage(sessionId: string, message: Message): void {
  const now = Date.now();
  const expiresAt = now + ROOM_MESSAGES_TTL_MS;

  if (!roomMessagesMap.has(sessionId)) {
    roomMessagesMap.set(sessionId, []);
  }

  const messages = roomMessagesMap.get(sessionId)!;
  messages.push({ message, expiresAt });

  cleanupExpiredMessages(sessionId);

  logInfo('[ROOM MESSAGES] Mensagem adicionada', {
    sessionId,
    messageId: message.id,
    totalMessages: messages.length,
  });
}

export function getRoomMessages(sessionId: string): Message[] {
  cleanupExpiredMessages(sessionId);

  const entries = roomMessagesMap.get(sessionId) || [];
  return entries.map(entry => entry.message);
}

export function clearRoomMessages(sessionId: string): void {
  const count = roomMessagesMap.get(sessionId)?.length || 0;
  roomMessagesMap.delete(sessionId);

  logInfo('[ROOM MESSAGES] Mensagens limpas', {
    sessionId,
    count,
  });
}

function cleanupExpiredMessages(sessionId: string): void {
  const entries = roomMessagesMap.get(sessionId);
  if (!entries) return;

  const now = Date.now();
  const validEntries = entries.filter(entry => entry.expiresAt > now);

  if (validEntries.length === 0) {
    roomMessagesMap.delete(sessionId);
  } else if (validEntries.length < entries.length) {
    roomMessagesMap.set(sessionId, validEntries);
  }
}

export function cleanupAllExpired(): number {
  let totalCleaned = 0;
  const now = Date.now();

  for (const [sessionId, entries] of roomMessagesMap.entries()) {
    const validEntries = entries.filter(entry => entry.expiresAt > now);
    const cleaned = entries.length - validEntries.length;

    if (validEntries.length === 0) {
      roomMessagesMap.delete(sessionId);
    } else if (cleaned > 0) {
      roomMessagesMap.set(sessionId, validEntries);
    }

    totalCleaned += cleaned;
  }

  if (totalCleaned > 0) {
    logInfo('[ROOM MESSAGES] Limpeza automática executada', {
      totalCleaned,
      remainingSessions: roomMessagesMap.size,
    });
  }

  return totalCleaned;
}

export function getStats() {
  let totalMessages = 0;
  for (const entries of roomMessagesMap.values()) {
    totalMessages += entries.length;
  }

  return {
    totalSessions: roomMessagesMap.size,
    totalMessages,
  };
}
