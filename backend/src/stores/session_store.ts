import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Session } from '../models/session_schemas.js';
import { logInfo, logDebug } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sessionsCache: Session[] | null = null;
const sessionIndexById = new Map<string, Session>();
const sessionIndexByCode = new Map<string, Session>();

function loadSessions(): Session[] {
  if (sessionsCache !== null) {
    logDebug('[SESSION_STORE] Usando cache de sessões');
    return sessionsCache;
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    logInfo('[SESSION_STORE] Arquivo de sessões não existe, criando novo');
    sessionsCache = [];
    return [];
  }

  const startTime = Date.now();
  const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
  const sessions: Session[] = JSON.parse(data);
  sessionsCache = sessions;

  sessionIndexById.clear();
  sessionIndexByCode.clear();
  for (const session of sessions) {
    sessionIndexById.set(session.id, session);
    sessionIndexByCode.set(session.sessionCode, session);
  }

  logInfo('[SESSION_STORE] Sessões carregadas do disco', { 
    count: sessions.length, 
    duration: `${Date.now() - startTime}ms` 
  });
  return sessions;
}

function saveSessions(sessions: Session[]): void {
  const startTime = Date.now();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  sessionsCache = sessions;

  sessionIndexById.clear();
  sessionIndexByCode.clear();
  for (const session of sessions) {
    sessionIndexById.set(session.id, session);
    sessionIndexByCode.set(session.sessionCode, session);
  }
  
  logInfo('[SESSION_STORE] Sessões salvas no disco', { 
    count: sessions.length, 
    duration: `${Date.now() - startTime}ms` 
  });
}

export function createSession(session: Session): Session {
  logInfo('[SESSION_STORE] Criando nova sessão', { sessionId: session.id, sessionCode: session.sessionCode });
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function findById(id: string): Session | undefined {
  loadSessions();
  return sessionIndexById.get(id);
}

export function findByCode(sessionCode: string): Session | undefined {
  loadSessions();
  return sessionIndexByCode.get(sessionCode);
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
  logDebug('[SESSION_STORE] Atualizando sessão', { sessionId: id, fields: Object.keys(updates) });
  const sessions = loadSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) {
    logInfo('[SESSION_STORE] Sessão não encontrada para atualização', { sessionId: id });
    return null;
  }

  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveSessions(sessions);
  logInfo('[SESSION_STORE] Sessão atualizada com sucesso', { sessionId: id });
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
