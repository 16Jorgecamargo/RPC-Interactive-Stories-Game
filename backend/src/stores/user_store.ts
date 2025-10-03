import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/auth_schemas.js';
import { logInfo, logDebug } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    logDebug('[USER_STORE] Arquivo de usuários não existe');
    return [];
  }
  const startTime = Date.now();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  const users = JSON.parse(data);
  logDebug('[USER_STORE] Usuários carregados', { count: users.length, duration: `${Date.now() - startTime}ms` });
  return users;
}

function saveUsers(users: User[]) {
  const startTime = Date.now();
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  logDebug('[USER_STORE] Usuários salvos', { count: users.length, duration: `${Date.now() - startTime}ms` });
}

export function createUser(username: string, passwordHash: string): User {
  logInfo('[USER_STORE] Criando novo usuário', { username });
  const users = loadUsers();

  const userId = `user_${uuidv4()}`;

  const newUser: User = {
    id: userId,
    username,
    password: passwordHash,
    role: 'USER',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  logInfo('[USER_STORE] Usuário criado com sucesso', { userId, username });
  return newUser;
}

export function findByUsername(username: string): User | undefined {
  const users = loadUsers();
  return users.find((u) => u.username === username);
}

export function findById(id: string): User | undefined {
  const users = loadUsers();
  return users.find((u) => u.id === id);
}

export function userExists(username: string): boolean {
  return findByUsername(username) !== undefined;
}

export function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
  logDebug('[USER_STORE] Atualizando usuário', { userId, fields: Object.keys(updates) });
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    logInfo('[USER_STORE] Usuário não encontrado para atualização', { userId });
    return null;
  }

  users[index] = { ...users[index], ...updates };
  saveUsers(users);

  logInfo('[USER_STORE] Usuário atualizado com sucesso', { userId });
  return users[index];
}

export function updatePassword(userId: string, newPasswordHash: string): boolean {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  users[index].password = newPasswordHash;
  saveUsers(users);

  return true;
}

export function getAllUsers(): User[] {
  return loadUsers();
}

export function deleteUser(userId: string): boolean {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  saveUsers(users);

  return true;
}
