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
