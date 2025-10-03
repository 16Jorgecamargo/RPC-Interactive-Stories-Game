import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/auth_schemas.js';

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
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function createUser(username: string, passwordHash: string): User {
  const users = loadUsers();

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newUser: User = {
    id: userId,
    username,
    password: passwordHash,
    role: 'USER',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

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
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    return null;
  }

  users[index] = { ...users[index], ...updates };
  saveUsers(users);

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
