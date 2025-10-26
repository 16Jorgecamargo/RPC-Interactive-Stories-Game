import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CombatState } from '../models/combat_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const COMBAT_FILE = path.join(DATA_DIR, 'combats.json');

interface CombatData {
  combats: CombatState[];
}

function load(): CombatData {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    if (!existsSync(COMBAT_FILE)) {
      return { combats: [] };
    }

    const raw = readFileSync(COMBAT_FILE, 'utf-8');
    if (!raw.trim()) {
      return { combats: [] };
    }

    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return { combats: parsed as CombatState[] };
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as CombatData).combats)) {
      return parsed as CombatData;
    }

    return { combats: [] };
  } catch {
    return { combats: [] };
  }
}

function save(data: CombatData): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  writeFileSync(COMBAT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function findBySessionId(sessionId: string): CombatState | null {
  const data = load();
  return data.combats.find((c) => c.sessionId === sessionId && c.isActive) || null;
}

export function create(combatState: CombatState): CombatState {
  const data = load();
  data.combats.push(combatState);
  save(data);
  return combatState;
}

export function update(sessionId: string, updates: Partial<CombatState>): CombatState | null {
  const data = load();
  const index = data.combats.findIndex((c) => c.sessionId === sessionId && c.isActive);
  
  if (index === -1) {
    return null;
  }

  data.combats[index] = { ...data.combats[index], ...updates };
  save(data);
  return data.combats[index];
}

export function endCombat(sessionId: string, winningSide: 'PLAYERS' | 'ENEMIES'): CombatState | null {
  const data = load();
  const index = data.combats.findIndex((c) => c.sessionId === sessionId && c.isActive);
  
  if (index === -1) {
    return null;
  }

  data.combats[index].isActive = false;
  data.combats[index].winningSide = winningSide;
  save(data);
  return data.combats[index];
}

export function deleteBySessionId(sessionId: string): void {
  const data = load();
  data.combats = data.combats.filter((c) => c.sessionId !== sessionId);
  save(data);
}
