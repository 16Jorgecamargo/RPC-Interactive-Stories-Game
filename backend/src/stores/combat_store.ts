import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { CombatState } from '../models/combat_schemas.js';

const COMBAT_FILE = join(process.cwd(), 'data', 'combats.json');

interface CombatData {
  combats: CombatState[];
}

function load(): CombatData {
  try {
    const raw = readFileSync(COMBAT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { combats: [] };
  }
}

function save(data: CombatData): void {
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
