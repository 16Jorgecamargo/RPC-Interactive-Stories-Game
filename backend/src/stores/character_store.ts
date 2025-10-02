import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Character } from '../models/character_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadCharacters(): Character[] {
  if (!fs.existsSync(CHARACTERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveCharacters(characters: Character[]): void {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

export function createCharacter(character: Character): Character {
  const characters = loadCharacters();
  characters.push(character);
  saveCharacters(characters);
  return character;
}

export function findById(id: string): Character | undefined {
  const characters = loadCharacters();
  return characters.find((c) => c.id === id);
}

export function findByUserId(userId: string): Character[] {
  const characters = loadCharacters();
  return characters.filter((c) => c.userId === userId);
}

export function findBySessionId(sessionId: string): Character[] {
  const characters = loadCharacters();
  return characters.filter((c) => c.sessionId === sessionId);
}

export function findByUserIdAndSessionId(userId: string, sessionId: string): Character | undefined {
  const characters = loadCharacters();
  return characters.find((c) => c.userId === userId && c.sessionId === sessionId);
}

export function updateCharacter(
  id: string,
  updates: Partial<Omit<Character, 'id' | 'userId' | 'createdAt'>>
): Character | null {
  const characters = loadCharacters();
  const index = characters.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  characters[index] = {
    ...characters[index],
    ...updates,
  };

  saveCharacters(characters);
  return characters[index];
}

export function deleteCharacter(id: string): boolean {
  const characters = loadCharacters();
  const index = characters.findIndex((c) => c.id === id);

  if (index === -1) {
    return false;
  }

  characters.splice(index, 1);
  saveCharacters(characters);
  return true;
}

export function findAll(): Character[] {
  return loadCharacters();
}
