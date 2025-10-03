import * as combatStore from '../stores/combat_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as characterStore from '../stores/character_store.js';
import * as storyStore from '../stores/story_store.js';
import * as eventStore from '../stores/event_store.js';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import type { CombatState, Enemy, CombatParticipant, InitiateCombat, InitiateCombatResponse } from '../models/combat_schemas.js';
import type { GameUpdate } from '../models/update_schemas.js';
import { v4 as uuidv4 } from 'uuid';

function calculateMaxHp(constitution: number): number {
  const modifier = Math.floor((constitution - 10) / 2);
  const baseHp = 10;
  return Math.max(1, baseHp + modifier * 2);
}

function generateEnemies(chapterText: string): Enemy[] {
  const goblinMatch = chapterText.match(/(\d+)\s*goblins?/i);
  const trollMatch = chapterText.match(/troll/i);
  const dragonMatch = chapterText.match(/drag[ãa]o/i);

  const enemies: Enemy[] = [];

  if (goblinMatch) {
    const count = parseInt(goblinMatch[1]) || 1;
    for (let i = 0; i < Math.min(count, 5); i++) {
      enemies.push({
        id: `enemy_goblin_${i + 1}`,
        name: `Goblin ${i + 1}`,
        hp: 7,
        maxHp: 7,
        ac: 13,
        isDead: false,
      });
    }
  } else if (trollMatch) {
    enemies.push({
      id: 'enemy_troll_1',
      name: 'Troll das Cavernas',
      hp: 30,
      maxHp: 30,
      ac: 15,
      isDead: false,
    });
  } else if (dragonMatch) {
    enemies.push({
      id: 'enemy_dragon_1',
      name: 'Dragão Jovem',
      hp: 50,
      maxHp: 50,
      ac: 17,
      isDead: false,
    });
  } else {
    enemies.push({
      id: 'enemy_bandit_1',
      name: 'Bandido',
      hp: 11,
      maxHp: 11,
      ac: 12,
      isDead: false,
    });
  }

  return enemies;
}

export async function initiateCombat(params: InitiateCombat): Promise<InitiateCombatResponse> {
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

    if (session.status !== 'IN_PROGRESS') {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Apenas sessões em progresso podem iniciar combate',
        data: { sessionId, currentStatus: session.status },
      };
    }

    const existingCombat = combatStore.findBySessionId(sessionId);
    if (existingCombat) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Já existe um combate ativo nesta sessão',
        data: { sessionId },
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

    const enemies = generateEnemies(currentChapter.texto);

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

  let damage: import('../models/combat_schemas.js').DamageRoll | null = null;
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
    
    let damageDice: number;
    switch (character.class) {
      case 'Warrior':
        damageDice = Math.floor(Math.random() * 10) + 1;
        break;
      case 'Rogue':
        damageDice = Math.floor(Math.random() * 8) + 1;
        break;
      case 'Mage':
        damageDice = Math.floor(Math.random() * 6) + 1;
        break;
      case 'Cleric':
        damageDice = Math.floor(Math.random() * 8) + 1;
        break;
      default:
        damageDice = Math.floor(Math.random() * 6) + 1;
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

    target.hp = Math.max(0, target.hp - totalDamage);

    if (target.hp === 0) {
      target.isDead = true;
    }
  }

  combatState.currentTurnIndex = (combatState.currentTurnIndex + 1) % combatState.turnOrder.length;

  const allEnemiesDead = combatState.enemies.every((e) => e.isDead);
  const allPlayersDead = combatState.participants.every((p) => p.isDead);

  let combatEnded = false;
  let winningSide: 'PLAYERS' | 'ENEMIES' | 'NONE' = 'NONE';

  if (allEnemiesDead) {
    combatState.isActive = false;
    combatState.winningSide = 'PLAYERS';
    combatEnded = true;
    winningSide = 'PLAYERS';
  } else if (allPlayersDead) {
    combatState.isActive = false;
    combatState.winningSide = 'ENEMIES';
    combatEnded = true;
    winningSide = 'ENEMIES';
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
      targetId,
      targetName,
      hit,
      critical: isCritical,
      criticalFail: isCriticalFail,
      damage: damage?.total || 0,
      criticalFailDamage,
      targetDied: target.isDead,
      combatEnded,
      winningSide: combatEnded ? winningSide : undefined,
    },
  };

  eventStore.addUpdate(update);

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
