import * as combatStore from '../stores/combat_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as characterStore from '../stores/character_store.js';
import * as storyStore from '../stores/story_store.js';
import * as eventStore from '../stores/event_store.js';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import { logInfo, logWarning } from '../utils/logger.js';
import type {
  CombatState,
  Enemy,
  CombatParticipant,
  InitiateCombat,
  InitiateCombatResponse,
  SkipTurn,
  SkipTurnResponse,
} from '../models/combat_schemas.js';
import type { GameUpdate } from '../models/update_schemas.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateMaxHp(constitution: number): number {
  const modifier = Math.floor((constitution - 10) / 2);
  const baseHp = 10;
  return Math.max(1, baseHp + modifier * 2);
}

interface MonsterAction {
  name: string;
  type: string;
  attackBonus: number;
  reach?: number;
  range?: string;
  damage: string;
}

interface MonsterTrait {
  name: string;
  description: string;
}

interface MonsterData {
  id: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  armorClass: number;
  hitPoints: number;
  hitDice?: string;
  speed?: {
    walk?: number;
    fly?: number;
    swim?: number;
  };
  abilities?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills?: Record<string, number>;
  senses?: Record<string, number>;
  languages?: string[];
  challengeRating?: number;
  xp?: number;
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
}

interface MonstersFile {
  monsters: MonsterData[];
}

function resolveMonstersPath(storyId: string): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'stories', storyId, 'monsters.json'),
    path.join(__dirname, '..', '..', '..', 'stories', storyId, 'monsters.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function loadMonstersData(storyId: string): MonstersFile | null {
  try {
    const monstersPath = resolveMonstersPath(storyId);

    logInfo('[COMBAT] Tentando carregar monsters.json', { path: monstersPath, storyId });

    if (!monstersPath) {
      logWarning('[COMBAT] Arquivo monsters.json não encontrado', { storyId });
      return null;
    }

    const fileContent = fs.readFileSync(monstersPath, 'utf-8');
    const parsed = JSON.parse(fileContent) as MonstersFile;

    logInfo('[COMBAT] monsters.json carregado com sucesso', {
      storyId,
      monsterCount: parsed.monsters?.length || 0
    });

    return parsed;
  } catch (error) {
    logWarning('[COMBAT] Erro ao carregar monsters.json', { storyId, error });
    return null;
  }
}

function generateEnemies(storyId: string, monsterId?: string, monsterCount?: number): Enemy[] {
  const enemies: Enemy[] = [];

  if (!monsterId || !monsterCount) {
    logWarning('[COMBAT] monsterId ou monsterCount não especificado, usando bandido padrão');
    enemies.push({
      id: 'enemy_bandit_1',
      monsterId: 'bandit',
      name: 'Bandido',
      hp: 11,
      maxHp: 11,
      ac: 12,
      isDead: false,
    });
    return enemies;
  }

  const monstersData = loadMonstersData(storyId);
  if (!monstersData || !monstersData.monsters || monstersData.monsters.length === 0) {
    logWarning('[COMBAT] Falha ao carregar monsters.json, usando inimigo padrão');
    enemies.push({
      id: `enemy_${monsterId}_1`,
      monsterId,
      name: monsterId,
      hp: 10,
      maxHp: 10,
      ac: 10,
      isDead: false,
    });
    return enemies;
  }

  const monsterTemplate = monstersData.monsters.find(m => m.id === monsterId);
  if (!monsterTemplate) {
    logWarning('[COMBAT] Monstro não encontrado em monsters.json', { monsterId });
    enemies.push({
      id: `enemy_${monsterId}_1`,
      monsterId,
      name: monsterId,
      hp: 10,
      maxHp: 10,
      ac: 10,
      isDead: false,
    });
    return enemies;
  }

  const count = Math.min(monsterCount, 10);
  for (let i = 0; i < count; i++) {
    enemies.push({
      id: `enemy_${monsterId}_${i + 1}`,
      monsterId,
      name: count > 1 ? `${monsterTemplate.name} ${i + 1}` : monsterTemplate.name,
      hp: monsterTemplate.hitPoints,
      maxHp: monsterTemplate.hitPoints,
      ac: monsterTemplate.armorClass,
      isDead: false,
      size: monsterTemplate.size,
      type: monsterTemplate.type,
      alignment: monsterTemplate.alignment,
      abilities: monsterTemplate.abilities,
      skills: monsterTemplate.skills,
      senses: monsterTemplate.senses,
      languages: monsterTemplate.languages,
      challengeRating: monsterTemplate.challengeRating,
      xp: monsterTemplate.xp,
      traits: monsterTemplate.traits,
      actions: monsterTemplate.actions,
    });
  }

  logInfo('[COMBAT] Inimigos gerados', {
    storyId,
    monsterId,
    monsterCount: count,
    monsterName: monsterTemplate.name
  });

  return enemies;
}

const MAX_AUTOMATED_ENEMY_ACTIONS = 10;

interface ParsedDamageExpression {
  count: number;
  sides: number;
  modifier: number;
  type: string | null;
  hasModifier: boolean;
}

interface DamageDetail {
  rolls: number[];
  modifier: number;
  total: number;
  expression: string;
  sides: number;
  type: string | null;
  isCritical: boolean;
}

function getAbilityModifier(score?: number): number {
  if (typeof score !== 'number') {
    return 0;
  }
  return Math.floor((score - 10) / 2);
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * Math.max(2, sides)) + 1;
}

function rollDice(count: number, sides: number): number[] {
  const results: number[] = [];
  const diceCount = Math.max(1, count);
  const diceSides = Math.max(2, sides);

  for (let i = 0; i < diceCount; i += 1) {
    results.push(rollDie(diceSides));
  }

  return results;
}

function parseDamageExpression(expression?: string | null): ParsedDamageExpression {
  const defaultResult: ParsedDamageExpression = {
    count: 1,
    sides: 6,
    modifier: 0,
    type: null,
    hasModifier: false,
  };

  if (!expression || typeof expression !== 'string') {
    return defaultResult;
  }

  const trimmed = expression.trim();
  const match = trimmed.match(/(\d+)d(\d+)([+-]\d+)?/i);

  if (!match) {
    return {
      ...defaultResult,
      type: trimmed || null,
    };
  }

  const count = Number.parseInt(match[1] ?? '1', 10) || 1;
  const sides = Number.parseInt(match[2] ?? '6', 10) || 6;
  const modifierStr = match[3];
  const modifier = modifierStr ? Number.parseInt(modifierStr, 10) : 0;
  const hasModifier = Boolean(modifierStr);
  const typePart = trimmed.replace(match[0], '').trim();

  return {
    count: Math.max(1, count),
    sides: Math.max(2, sides),
    modifier,
    type: typePart || null,
    hasModifier,
  };
}

function inferAttackAbilityAttribute(action?: MonsterAction): keyof Enemy['abilities'] {
  if (!action || !action.type) {
    return 'strength';
  }

  const type = action.type.toLowerCase();
  if (type.includes('distância') || type.includes('à distância') || type.includes('distance')) {
    return 'dexterity';
  }

  return 'strength';
}

function getEnemyAttackBonus(enemy: Enemy, action?: MonsterAction): number {
  if (action && typeof action.attackBonus === 'number') {
    return action.attackBonus;
  }

  const abilityKey = inferAttackAbilityAttribute(action);
  const abilityScore = enemy.abilities?.[abilityKey];
  return getAbilityModifier(abilityScore);
}

function buildDamageDetail(parsed: ParsedDamageExpression, baseRolls: number[], modifier: number, isCritical: boolean): DamageDetail {
  const rolls = [...baseRolls];

  if (isCritical) {
    const criticalRolls = rollDice(parsed.count, parsed.sides);
    rolls.push(...criticalRolls);
  }

  const sum = rolls.reduce((acc, value) => acc + value, 0);
  const total = Math.max(1, sum + modifier);

  const effectiveDiceCount = isCritical ? parsed.count * 2 : parsed.count;
  const modifierText = modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
  const expression = `${effectiveDiceCount}d${parsed.sides}${modifierText}`;

  return {
    rolls,
    modifier,
    total,
    expression,
    sides: parsed.sides,
    type: parsed.type,
    isCritical,
  };
}

function selectEnemyTarget(participants: CombatParticipant[]): CombatParticipant | null {
  const aliveParticipants = participants.filter((participant) => !participant.isDead);
  if (aliveParticipants.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * aliveParticipants.length);
  return aliveParticipants[index];
}

function getParticipantArmorClass(participant: CombatParticipant): number {
  const character = characterStore.findById(participant.characterId);
  const sheetAC = character?.sheet?.combatStats?.armorClass;
  if (typeof sheetAC === 'number') {
    return sheetAC;
  }

  const legacyAC = (character as { combatStats?: { armorClass?: number } } | undefined)?.combatStats?.armorClass;
  if (typeof legacyAC === 'number') {
    return legacyAC;
  }

  const manualAC = (character as { armorClass?: number } | undefined)?.armorClass;
  if (typeof manualAC === 'number') {
    return manualAC;
  }

  return 10;
}

function chooseEnemyAttack(enemy: Enemy): MonsterAction {
  if (enemy.actions && enemy.actions.length > 0) {
    const index = Math.floor(Math.random() * enemy.actions.length);
    return enemy.actions[index]!;
  }

  const abilityMod = getAbilityModifier(enemy.abilities?.strength);

  return {
    name: 'Ataque Básico',
    type: 'Ataque Corpo a Corpo',
    attackBonus: abilityMod,
    damage: '1d6',
  };
}

function ensureCurrentTurnAlive(combatState: CombatState): void {
  if (!combatState.turnOrder.length) {
    combatState.currentTurnIndex = 0;
    return;
  }

  for (let i = 0; i < combatState.turnOrder.length; i += 1) {
    const entityId = combatState.turnOrder[combatState.currentTurnIndex];
    const participant = combatState.participants.find((p) => p.characterId === entityId);
    if (participant && !participant.isDead) {
      return;
    }

    const enemy = combatState.enemies.find((e) => e.id === entityId);
    if (enemy && !enemy.isDead) {
      return;
    }

    combatState.currentTurnIndex = (combatState.currentTurnIndex + 1) % combatState.turnOrder.length;
  }
}

function advanceTurnIndex(combatState: CombatState): void {
  if (combatState.turnOrder.length === 0) {
    combatState.currentTurnIndex = 0;
    return;
  }

  combatState.currentTurnIndex = (combatState.currentTurnIndex + 1) % combatState.turnOrder.length;
  ensureCurrentTurnAlive(combatState);
}

function resolveCombatOutcome(combatState: CombatState): { ended: boolean; winningSide: 'PLAYERS' | 'ENEMIES' | 'NONE' } {
  const allEnemiesDead = combatState.enemies.every((enemy) => enemy.isDead);
  const allPlayersDead = combatState.participants.every((participant) => participant.isDead);

  if (allEnemiesDead) {
    combatState.isActive = false;
    combatState.winningSide = 'PLAYERS';
    return { ended: true, winningSide: 'PLAYERS' };
  }

  if (allPlayersDead) {
    combatState.isActive = false;
    combatState.winningSide = 'ENEMIES';
    return { ended: true, winningSide: 'ENEMIES' };
  }

  return { ended: false, winningSide: 'NONE' };
}

async function processEnemyTurns(sessionId: string, combatState: CombatState): Promise<void> {
  ensureCurrentTurnAlive(combatState);

  if (!combatState.isActive || combatState.turnOrder.length === 0) {
    return;
  }

  let actionsProcessed = 0;

  while (combatState.isActive && actionsProcessed < MAX_AUTOMATED_ENEMY_ACTIONS) {
    ensureCurrentTurnAlive(combatState);

    if (!combatState.isActive) {
      break;
    }

    const currentEntityId = combatState.turnOrder[combatState.currentTurnIndex];
    const actingEnemy = combatState.enemies.find((enemy) => enemy.id === currentEntityId && !enemy.isDead);

    if (!actingEnemy) {
      break;
    }

    const target = selectEnemyTarget(combatState.participants);
    if (!target) {
      break;
    }

    const attackAction = chooseEnemyAttack(actingEnemy);
    const abilityKey = inferAttackAbilityAttribute(attackAction);
    const abilityScore = actingEnemy.abilities?.[abilityKey];
    const abilityModifier = getAbilityModifier(abilityScore);
    const attackBonus = getEnemyAttackBonus(actingEnemy, attackAction);
    const d20Roll = rollDie(20);
    const targetAC = getParticipantArmorClass(target);
    const attackTotal = d20Roll + attackBonus;
    const isCritical = d20Roll === 20;
    const isCriticalFail = d20Roll === 1;
    const hit = !isCriticalFail && (isCritical || attackTotal >= targetAC);

    let damageDetail: DamageDetail | null = null;
    let appliedDamage = 0;

    if (hit) {
      const parsedDamage = parseDamageExpression(attackAction.damage);
      const damageModifier = parsedDamage.hasModifier ? parsedDamage.modifier : abilityModifier;
      const baseRolls = rollDice(parsedDamage.count, parsedDamage.sides);
      damageDetail = buildDamageDetail(parsedDamage, baseRolls, damageModifier, isCritical);
      appliedDamage = damageDetail.total;

      target.hp = Math.max(0, target.hp - appliedDamage);
      if (target.hp === 0) {
        target.isDead = true;
      }
    }

    const { ended: combatEnded, winningSide } = resolveCombatOutcome(combatState);

    const update: GameUpdate = {
      id: uuidv4(),
      sessionId,
      type: 'ATTACK_MADE',
      timestamp: new Date().toISOString(),
      data: {
        attackerId: actingEnemy.id,
        attackerName: actingEnemy.name,
        attackerType: 'ENEMY',
        attackName: attackAction.name,
        attackType: attackAction.type,
        targetId: target.characterId,
        targetName: target.characterName,
        hit,
        critical: isCritical,
        criticalFail: isCriticalFail,
        damage: appliedDamage,
        damageDetail,
        targetDied: target.isDead,
        attackRoll: {
          d20: d20Roll,
          attackBonus,
          total: attackTotal,
          targetAC,
          wasCritical: isCritical,
          wasCriticalFail: isCriticalFail,
        },
        combatEnded,
        winningSide: combatEnded ? winningSide : undefined,
      },
    };

    if (!combatEnded) {
      advanceTurnIndex(combatState);
    }

    combatStore.update(sessionId, combatState);
    eventStore.addUpdate(update);

    if (combatEnded) {
      break;
    }

    actionsProcessed += 1;
  }
}

export async function initiateCombat(params: InitiateCombat): Promise<InitiateCombatResponse> {
  const { token, sessionId } = params;

    const decoded = verifyToken(token);
    if (!decoded) {
      logWarning('[COMBAT] Token inválido', { sessionId });
      throw {
        ...JSON_RPC_ERRORS.UNAUTHORIZED,
        message: 'Token inválido ou expirado',
      };
    }

    logInfo('[COMBAT] Iniciando combate', { 
      sessionId, 
      userId: decoded.userId 
    });

    const session = await sessionStore.findById(sessionId);
    if (!session) {
      logWarning('[COMBAT] Sessão não encontrada', { sessionId });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Sessão não encontrada',
        data: { sessionId },
      };
    }

    if (session.status !== 'IN_PROGRESS') {
      logWarning('[COMBAT] Sessão não está em progresso', { 
        sessionId, 
        status: session.status 
      });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Apenas sessões em progresso podem iniciar combate',
        data: { sessionId, currentStatus: session.status },
      };
    }

    const existingCombat = combatStore.findBySessionId(sessionId);
    if (existingCombat) {
      logInfo('[COMBAT] Combate já existente retornado', { sessionId });
      return {
        success: true,
        combatState: existingCombat,
        message: 'Combate já estava ativo.',
      };
    }

    const story = storyStore.findById(session.storyId);
    if (!story) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'História não encontrada',
        data: { storyId: session.storyId },
      };
    }

    const currentChapter = story.capitulos[session.currentChapter];
    if (!currentChapter) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Capítulo atual não encontrado',
        data: { chapterId: session.currentChapter },
      };
    }

    if (!currentChapter.isCombat) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Capítulo atual não é um nó de combate',
        data: { chapterId: session.currentChapter, isCombat: false },
      };
    }

    const participants: CombatParticipant[] = [];
    for (const participant of session.participants) {
      if (!participant.characterId) {
        continue;
      }

      const character = characterStore.findById(participant.characterId);
      if (!character) {
        continue;
      }

      const maxHp = calculateMaxHp(character.attributes.constitution);
      participants.push({
        characterId: character.id,
        characterName: character.name,
        hp: maxHp,
        maxHp,
        isDead: false,
        reviveAttempts: 0,
      });
    }

    if (participants.length === 0) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Nenhum personagem disponível para combate',
        data: { sessionId },
      };
    }

    const enemies = generateEnemies(
      session.storyId,
      (currentChapter as any).monsterId,
      (currentChapter as any).monsterCount
    );

    const combatState: CombatState = {
      sessionId,
      chapterId: session.currentChapter,
      participants,
      enemies,
      turnOrder: [],
      currentTurnIndex: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const savedCombat = combatStore.create(combatState);

    logInfo('[COMBAT] Combate criado com sucesso', { 
      sessionId, 
      chapterId: session.currentChapter,
      enemyCount: enemies.length,
      participantCount: participants.length 
    });

    const combatUpdate: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'COMBAT_STARTED',
      timestamp: new Date().toISOString(),
      sessionId,
      data: {
        chapterId: session.currentChapter,
        enemyCount: enemies.length,
        participantCount: participants.length,
      },
    };
    eventStore.addUpdate(combatUpdate);

    return {
      success: true,
      combatState: savedCombat,
      message: 'Combate iniciado! Todos devem rolar iniciativa.',
    };
}

export async function getCombatState(params: { token: string; sessionId: string }): Promise<{ combatState: CombatState | null }> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  if (!decoded) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Token inválido ou expirado',
    };
  }

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  
  return {
    combatState,
  };
}

export async function rollInitiative(params: {
  token: string;
  sessionId: string;
  characterId: string;
}): Promise<{
  success: boolean;
  roll: {
    characterId: string;
    characterName: string;
    d20Roll: number;
    dexterityModifier: number;
    total: number;
  };
  allRolled: boolean;
  turnOrder?: string[];
}> {
  const { token, sessionId, characterId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  if (!combatState) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Nenhum combate ativo nesta sessão',
      data: { sessionId },
    };
  }

  if (!combatState.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Combate não está ativo',
      data: { sessionId },
    };
  }

  const character = characterStore.findById(characterId);
  if (!character) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem não encontrado',
      data: { characterId },
    };
  }

  if (character.userId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Este personagem não pertence a você',
      data: { characterId, userId },
    };
  }

  const participant = combatState.participants.find(
    (p) => p.characterId === characterId
  );

  if (!participant) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem não está participando deste combate',
      data: { characterId, sessionId },
    };
  }

  if (participant.initiative !== undefined) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Este personagem já rolou iniciativa',
      data: { characterId, initiative: participant.initiative },
    };
  }

  const d20Roll = Math.floor(Math.random() * 20) + 1;
  const dexterityModifier = Math.floor((character.attributes.dexterity - 10) / 2);
  const total = d20Roll + dexterityModifier;

  participant.initiative = total;

  const allParticipantsRolled = combatState.participants.every(
    (p) => p.initiative !== undefined
  );

  let turnOrder: string[] | undefined;

  if (allParticipantsRolled) {
    combatState.enemies.forEach((enemy) => {
      if (enemy.initiative === undefined) {
        const enemyD20 = Math.floor(Math.random() * 20) + 1;
        const enemyDexMod = 1;
        enemy.initiative = enemyD20 + enemyDexMod;
      }
    });

    const allEntities: Array<{ id: string; initiative: number; type: string }> = [
      ...combatState.participants.map((p) => ({
        id: p.characterId,
        initiative: p.initiative!,
        type: 'player',
      })),
      ...combatState.enemies.map((e) => ({
        id: e.id,
        initiative: e.initiative!,
        type: 'enemy',
      })),
    ];

    allEntities.sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      return a.type === 'player' ? -1 : 1;
    });

    combatState.turnOrder = allEntities.map((e) => e.id);
    combatState.currentTurnIndex = 0;
    ensureCurrentTurnAlive(combatState);
    turnOrder = combatState.turnOrder;

    const initiativeUpdate: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'COMBAT_STARTED',
      timestamp: new Date().toISOString(),
      sessionId,
      data: {
        message: 'Todas as iniciativas foram roladas! Combate começou!',
        turnOrder: combatState.turnOrder,
      },
    };
    eventStore.addUpdate(initiativeUpdate);
  }

  combatStore.update(combatState.sessionId, combatState);

  if (allParticipantsRolled) {
    await processEnemyTurns(sessionId, combatState);
  }

  return {
    success: true,
    roll: {
      characterId,
      characterName: character.name,
      d20Roll,
      dexterityModifier,
      total,
    },
    allRolled: allParticipantsRolled,
    turnOrder,
  };
}

export async function getCurrentTurn(params: {
  token: string;
  sessionId: string;
}): Promise<{
  currentTurn: {
    entityId: string;
    entityName: string;
    entityType: 'PLAYER' | 'ENEMY';
    turnIndex: number;
    totalTurns: number;
  } | null;
}> {
  const { token, sessionId } = params;

  verifyToken(token);

  const session = await sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  if (!combatState || !combatState.isActive) {
    return { currentTurn: null };
  }

  if (combatState.turnOrder.length === 0) {
    return { currentTurn: null };
  }

  const currentEntityId = combatState.turnOrder[combatState.currentTurnIndex];

  const participant = combatState.participants.find(
    (p) => p.characterId === currentEntityId
  );

  if (participant) {
    return {
      currentTurn: {
        entityId: currentEntityId,
        entityName: participant.characterName,
        entityType: 'PLAYER',
        turnIndex: combatState.currentTurnIndex,
        totalTurns: combatState.turnOrder.length,
      },
    };
  }

  const enemy = combatState.enemies.find((e) => e.id === currentEntityId);

  if (enemy) {
    return {
      currentTurn: {
        entityId: currentEntityId,
        entityName: enemy.name,
        entityType: 'ENEMY',
        turnIndex: combatState.currentTurnIndex,
        totalTurns: combatState.turnOrder.length,
      },
    };
  }

  return { currentTurn: null };
}

export async function performAttack(params: import('../models/combat_schemas.js').PerformAttack): Promise<import('../models/combat_schemas.js').PerformAttackResponse> {
  const { token, sessionId, characterId, targetId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const character = characterStore.findById(characterId);
  if (!character || character.userId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Personagem não pertence a você',
      data: { characterId, userId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  if (!combatState || !combatState.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não há combate ativo nesta sessão',
      data: { sessionId },
    };
  }

  const currentEntityId = combatState.turnOrder[combatState.currentTurnIndex];
  if (currentEntityId !== characterId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não é o turno deste personagem',
      data: { characterId, currentTurn: currentEntityId },
    };
  }

  const attacker = combatState.participants.find((p) => p.characterId === characterId);
  if (!attacker) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Atacante não encontrado no combate',
      data: { characterId },
    };
  }

  if (attacker.isDead) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem está morto e não pode atacar',
      data: { characterId },
    };
  }

  let target: Enemy | CombatParticipant | undefined = combatState.enemies.find((e) => e.id === targetId);

  if (!target) {
    target = combatState.participants.find((p) => p.characterId === targetId);
  }

  if (!target) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Alvo não encontrado no combate',
      data: { targetId },
    };
  }

  if (target.isDead) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Alvo já está morto',
      data: { targetId },
    };
  }

  const d20Roll = Math.floor(Math.random() * 20) + 1;
  const attackModifier = Math.floor((character.attributes.strength - 10) / 2);
  const attackTotal = d20Roll + attackModifier;
  const targetAC = ('ac' in target) ? target.ac : 10;

  const isCritical = d20Roll === 20;
  const isCriticalFail = d20Roll === 1;
  const hit = isCritical || (attackTotal >= targetAC && !isCriticalFail);

  const attackRoll = {
    d20Roll,
    modifier: attackModifier,
    total: attackTotal,
    targetAC,
    hit,
    critical: isCritical,
    criticalFail: isCriticalFail,
  };

  const attackRollEvent = {
    d20: d20Roll,
    attackBonus: attackModifier,
    total: attackTotal,
    targetAC,
    wasCritical: isCritical,
    wasCriticalFail: isCriticalFail,
  };

  let damage: import('../models/combat_schemas.js').DamageRoll | null = null;
  let damageDetail: DamageDetail | null = null;
  let criticalFailDamage: number | undefined = undefined;
  const attackerHpBefore = attacker.hp;
  const targetHpBefore = target.hp;

  if (isCriticalFail) {
    criticalFailDamage = Math.floor(Math.random() * 4) + 1;
    attacker.hp = Math.max(0, attacker.hp - criticalFailDamage);
    
    if (attacker.hp === 0) {
      attacker.isDead = true;
    }
  } else if (hit) {
    const damageModifier = Math.floor((character.attributes.strength - 10) / 2);
    let damageDiceSides = 6;
    let damageDice: number;
    switch (character.class) {
      case 'Warrior':
        damageDiceSides = 10;
        damageDice = Math.floor(Math.random() * damageDiceSides) + 1;
        break;
      case 'Rogue':
        damageDiceSides = 8;
        damageDice = Math.floor(Math.random() * damageDiceSides) + 1;
        break;
      case 'Mage':
        damageDiceSides = 6;
        damageDice = Math.floor(Math.random() * damageDiceSides) + 1;
        break;
      case 'Cleric':
        damageDiceSides = 8;
        damageDice = Math.floor(Math.random() * damageDiceSides) + 1;
        break;
      default:
        damageDiceSides = 6;
        damageDice = Math.floor(Math.random() * damageDiceSides) + 1;
    }

    let totalDamage = damageDice + damageModifier;

    if (isCritical) {
      totalDamage *= 2;
    }

    totalDamage = Math.max(1, totalDamage);

    damage = {
      diceRoll: damageDice,
      modifier: damageModifier,
      total: totalDamage,
      wasCritical: isCritical,
    };

    const rolls: number[] = [damageDice];
    if (isCritical) {
      rolls.push(damageDice);
    }

    const modifierText = damageModifier ? (damageModifier > 0 ? `+${damageModifier}` : `${damageModifier}`) : '';
    const expression = `${isCritical ? 2 : 1}d${damageDiceSides}${modifierText}`;

    damageDetail = {
      rolls,
      modifier: damageModifier,
      total: totalDamage,
      expression,
      sides: damageDiceSides,
      type: null,
      isCritical,
    };

    target.hp = Math.max(0, target.hp - totalDamage);

    if (target.hp === 0) {
      target.isDead = true;
    }
  }

  combatState.currentTurnIndex = (combatState.currentTurnIndex + 1) % combatState.turnOrder.length;

  const allEnemiesDead = combatState.enemies.every((e) => e.isDead);
  const allPlayersDead = combatState.participants.every((p) => p.isDead);

  const playersDead = combatState.participants.every((p) => p.isDead);
  const enemiesDead = combatState.enemies.every((e) => e.isDead);

  if (playersDead) {
    combatState.isActive = false;
    combatState.winningSide = 'ENEMIES';
  } else if (enemiesDead) {
    combatState.isActive = false;
    combatState.winningSide = 'PLAYERS';
  }

  const combatEnded = !combatState.isActive;
  const winningSide: 'PLAYERS' | 'ENEMIES' | 'NONE' = combatState.winningSide ?? 'NONE';

  if (!combatEnded) {
    advanceTurnIndex(combatState);
  }

  combatStore.update(sessionId, combatState);

  const targetName = ('name' in target) ? target.name : target.characterName;

  const update: GameUpdate = {
    id: uuidv4(),
    sessionId,
    type: 'ATTACK_MADE',
    timestamp: new Date().toISOString(),
    data: {
      attackerId: characterId,
      attackerName: character.name,
      attackerType: 'PLAYER',
      attackName: 'Ataque',
      attackType: character.class,
      targetId,
      targetName,
      hit,
      critical: isCritical,
      criticalFail: isCriticalFail,
      damage: damage?.total || 0,
      damageDetail,
      criticalFailDamage,
      targetDied: target.isDead,
      attackRoll: attackRollEvent,
      combatEnded,
      winningSide: combatEnded ? winningSide : undefined,
    },
  };

  eventStore.addUpdate(update);

  if (!combatEnded) {
    await processEnemyTurns(sessionId, combatState);
  }

  return {
    success: true,
    attackRoll,
    damage,
    criticalFailDamage,
    attacker: {
      id: characterId,
      name: character.name,
      hpBefore: attackerHpBefore,
      hpAfter: attacker.hp,
    },
    target: {
      id: targetId,
      name: targetName,
      hpBefore: targetHpBefore,
      hpAfter: target.hp,
      isDead: target.isDead,
    },
    combatEnded,
    winningSide: combatEnded ? winningSide : undefined,
  };
}

export async function skipTurn(params: SkipTurn): Promise<SkipTurnResponse> {
  const { token, sessionId, characterId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const character = characterStore.findById(characterId);
  if (!character || character.userId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Personagem não pertence a você',
      data: { characterId, userId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  if (!combatState || !combatState.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não há combate ativo nesta sessão',
      data: { sessionId },
    };
  }

  if (!combatState.turnOrder || combatState.turnOrder.length === 0) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Ordem de turnos ainda não foi definida',
      data: { sessionId },
    };
  }

  const currentEntityId = combatState.turnOrder[combatState.currentTurnIndex];
  if (currentEntityId !== characterId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não é o turno deste personagem',
      data: { characterId, currentTurn: currentEntityId },
    };
  }

  const participant = combatState.participants.find((p) => p.characterId === characterId);
  if (!participant) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem não está participando deste combate',
      data: { characterId, sessionId },
    };
  }

  if (participant.isDead) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem morto não pode pular turno',
      data: { characterId },
    };
  }

  const hpBefore = participant.hp;
  const constitution = character.attributes.constitution ?? 10;
  const conModifier = Math.floor((constitution - 10) / 2);
  const baseHeal = 2 + conModifier;
  const healAmount = Math.max(1, baseHeal);

  if (participant.maxHp === undefined) {
    participant.maxHp = calculateMaxHp(constitution);
  }

  participant.hp = Math.min(participant.maxHp, participant.hp + healAmount);
  const actualHeal = participant.hp - hpBefore;

  if (participant.hp > 0) {
    participant.isDead = false;
  }

  advanceTurnIndex(combatState);

  let nextTurn:
    | {
        entityId: string;
        entityName: string;
        entityType: 'PLAYER' | 'ENEMY';
        turnIndex: number;
        totalTurns: number;
      }
    | undefined;

  if (combatState.turnOrder.length > 0 && combatState.isActive) {
    const nextEntityId = combatState.turnOrder[combatState.currentTurnIndex];
    const nextParticipant = combatState.participants.find((p) => p.characterId === nextEntityId);
    const nextEnemy = combatState.enemies.find((e) => e.id === nextEntityId);

    if (nextParticipant) {
      nextTurn = {
        entityId: nextParticipant.characterId,
        entityName: nextParticipant.characterName,
        entityType: 'PLAYER',
        turnIndex: combatState.currentTurnIndex,
        totalTurns: combatState.turnOrder.length,
      };
    } else if (nextEnemy) {
      nextTurn = {
        entityId: nextEnemy.id,
        entityName: nextEnemy.name,
        entityType: 'ENEMY',
        turnIndex: combatState.currentTurnIndex,
        totalTurns: combatState.turnOrder.length,
      };
    }
  }

  combatStore.update(sessionId, combatState);

  const update: GameUpdate = {
    id: uuidv4(),
    sessionId,
    type: 'TURN_SKIPPED',
    timestamp: new Date().toISOString(),
    data: {
      characterId,
      characterName: character.name,
      healAmount: actualHeal,
      hpAfter: participant.hp,
      nextTurn,
    },
  };

  eventStore.addUpdate(update);

  await processEnemyTurns(sessionId, combatState);

  return {
    success: true,
    healed: {
      id: characterId,
      name: character.name,
      amount: actualHeal,
      hpBefore,
      hpAfter: participant.hp,
    },
    combatEnded: false,
    nextTurn,
    message:
      actualHeal > 0
        ? `Turno pulado. Você recuperou ${actualHeal} ponto${actualHeal === 1 ? '' : 's'} de vida.`
        : 'Turno pulado. Você já está no máximo de vida.',
  };
}

export async function attemptRevive(params: import('../models/combat_schemas.js').AttemptRevive): Promise<import('../models/combat_schemas.js').AttemptReviveResponse> {
  const { token, sessionId, characterId, reviverId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const reviverCharacter = characterStore.findById(reviverId);
  if (!reviverCharacter || reviverCharacter.userId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Personagem revivedor não pertence a você',
      data: { reviverId, userId },
    };
  }

  const targetCharacter = characterStore.findById(characterId);
  if (!targetCharacter) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem alvo não encontrado',
      data: { characterId },
    };
  }

  const combatState = combatStore.findBySessionId(sessionId);
  if (!combatState || !combatState.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não há combate ativo nesta sessão',
      data: { sessionId },
    };
  }

  const reviver = combatState.participants.find((p) => p.characterId === reviverId);
  if (!reviver) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem revivedor não está no combate',
      data: { reviverId },
    };
  }

  if (reviver.isDead) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem revivedor está morto e não pode reviver outros',
      data: { reviverId },
    };
  }

  const target = combatState.participants.find((p) => p.characterId === characterId);
  if (!target) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem alvo não está no combate',
      data: { characterId },
    };
  }

  if (!target.isDead) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem alvo não está morto',
      data: { characterId },
    };
  }

  if (target.reviveAttempts >= 3) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Personagem já usou todas as 3 tentativas de ressurreição e está permanentemente morto',
      data: { characterId, reviveAttempts: target.reviveAttempts },
    };
  }

  const dice1 = Math.floor(Math.random() * 10) + 1;
  const dice2 = Math.floor(Math.random() * 10) + 1;
  const total = dice1 + dice2;
  const reviveSuccess = total >= 11;

  target.reviveAttempts += 1;

  const attemptsRemaining = 3 - target.reviveAttempts;
  const permanentlyDead = target.reviveAttempts >= 3 && !reviveSuccess;

  if (reviveSuccess) {
    target.isDead = false;
    target.hp = Math.floor(target.maxHp * 0.5);
  }

  combatStore.update(sessionId, combatState);

  const update: GameUpdate = {
    id: uuidv4(),
    sessionId,
    type: reviveSuccess ? 'CHARACTER_REVIVED' : 'REVIVE_FAILED',
    timestamp: new Date().toISOString(),
    data: {
      characterId,
      characterName: targetCharacter.name,
      reviverId,
      reviverName: reviverCharacter.name,
      dice1,
      dice2,
      total,
      success: reviveSuccess,
      attemptsUsed: target.reviveAttempts,
      attemptsRemaining,
      permanentlyDead,
      hpRestored: reviveSuccess ? target.hp : 0,
    },
  };

  eventStore.addUpdate(update);

  return {
    success: true,
    reviveRoll: {
      dice1,
      dice2,
      total,
      success: reviveSuccess,
    },
    revived: reviveSuccess,
    attemptsUsed: target.reviveAttempts,
    attemptsRemaining,
    permanentlyDead,
    character: {
      id: characterId,
      name: targetCharacter.name,
      hp: target.hp,
      maxHp: target.maxHp,
      isDead: target.isDead,
      reviveAttempts: target.reviveAttempts,
    },
  };
}
