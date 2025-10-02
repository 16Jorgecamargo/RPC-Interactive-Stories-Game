import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Session } from '../models/session_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSessions(): Session[] {
  if (!fs.existsSync(SESSIONS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveSessions(sessions: Session[]): void {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export function createSession(session: Session): Session {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function findById(id: string): Session | undefined {
  const sessions = loadSessions();
  return sessions.find((s) => s.id === id);
}

export function findByCode(sessionCode: string): Session | undefined {
  const sessions = loadSessions();
  return sessions.find((s) => s.sessionCode === sessionCode);
}

export function findByUserId(userId: string): Session[] {
  const sessions = loadSessions();
  return sessions.filter((s) => s.participants.some((p) => p.userId === userId));
}

export function findAll(): Session[] {
  return loadSessions();
}

export function updateSession(
  id: string,
  updates: Partial<Omit<Session, 'id' | 'sessionCode' | 'createdAt'>>,
): Session | null {
  const sessions = loadSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) {
    return null;
  }

  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveSessions(sessions);
  return sessions[index];
}

export function deleteSession(id: string): boolean {
  const sessions = loadSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) {
    return false;
  }

  sessions.splice(index, 1);
  saveSessions(sessions);
  return true;
}

export function sessionCodeExists(sessionCode: string): boolean {
  const sessions = loadSessions();
  return sessions.some((s) => s.sessionCode === sessionCode);
}
