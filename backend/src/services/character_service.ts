import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/jwt.js';
import * as characterStore from '../stores/character_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as eventStore from '../stores/event_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import { logInfo, logWarning } from '../utils/logger.js';
import type { GameUpdate } from '../models/update_schemas.js';
import {
  CreateCharacter,
  GetCharacters,
  GetCharacter,
  UpdateCharacter,
  DeleteCharacter,
  CharacterResponse,
  CharactersList,
  DeleteCharacterResponse,
  Character,
  type AbilityScoreIncrease,
  type AttributeBonusPerLevel,
  type Race,
  type Class,
  type SelectedAttack,
  type SelectedSpell,
} from '../models/character_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORIES_DIR = path.join(__dirname, '../../stories');
const STARTING_LEVEL = 1;

interface AttributesInput {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

function calculateFinalAttributes(
  baseAttributes: AttributesInput,
  racialBonuses: AbilityScoreIncrease,
  classBonuses: AttributeBonusPerLevel
): AttributesInput {
  return {
    strength: (baseAttributes.strength || 0) + (racialBonuses.strength || 0) + (classBonuses.strength || 0),
    dexterity: (baseAttributes.dexterity || 0) + (racialBonuses.dexterity || 0) + (classBonuses.dexterity || 0),
    constitution: (baseAttributes.constitution || 0) + (racialBonuses.constitution || 0) + (classBonuses.constitution || 0),
    intelligence: (baseAttributes.intelligence || 0) + (racialBonuses.intelligence || 0) + (classBonuses.intelligence || 0),
    wisdom: (baseAttributes.wisdom || 0) + (racialBonuses.wisdom || 0) + (classBonuses.wisdom || 0),
    charisma: (baseAttributes.charisma || 0) + (racialBonuses.charisma || 0) + (classBonuses.charisma || 0),
  };
}

export async function createCharacter(params: CreateCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);
  const userId = decoded.userId;

  logInfo('[CHARACTER] Iniciando criação de personagem', {
    userId,
    characterName: params.name,
    sessionId: params.sessionId
  });

  let sessionId: string | null = null;
  let storyId = params.storyId;

  if (params.sessionId) {
    const session = sessionStore.findById(params.sessionId);

    if (!session) {
      logWarning('[CHARACTER] Sessão não encontrada', { sessionId: params.sessionId, userId });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Sessão não encontrada',
        data: { sessionId: params.sessionId },
      };
    }

    if (session.status !== 'CREATING_CHARACTERS' && session.status !== 'WAITING_PLAYERS') {
      logWarning('[CHARACTER] Sessão em estado inválido', {
        sessionId: params.sessionId,
        currentStatus: session.status,
        userId
      });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'A sessão deve estar em WAITING_PLAYERS ou CREATING_CHARACTERS para criar personagens',
        data: { currentStatus: session.status },
      };
    }

    const isParticipant = session.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw {
        ...JSON_RPC_ERRORS.FORBIDDEN,
        message: 'Você não é participante desta sessão',
      };
    }

    const alreadyHasCharacter = session.participants.find((p) => p.userId === userId)
      ?.hasCreatedCharacter;
    if (alreadyHasCharacter) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Você já criou um personagem para esta sessão',
      };
    }

    sessionId = params.sessionId;
    storyId = storyId || session.storyId;
  }

  if (!storyId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'storyId é obrigatório quando não está em uma sessão',
    };
  }

  const playerOptionsPath = path.join(STORIES_DIR, storyId, 'player-options.json');

  if (!fs.existsSync(playerOptionsPath)) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Opções de personagem não encontradas para a história "${storyId}"`,
      data: { storyId, path: playerOptionsPath },
    };
  }

  let playerOptions: { races: Race[]; classes: Class[] };
  try {
    const fileContent = fs.readFileSync(playerOptionsPath, 'utf-8');
    playerOptions = JSON.parse(fileContent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Erro ao carregar opções de personagem: ${errorMessage}`,
      data: { storyId, details: errorMessage },
    };
  }

  const selectedRace = playerOptions.races.find((r) => r.id === params.race || r.name === params.race);
  if (!selectedRace) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Raça "${params.race}" não encontrada nas opções disponíveis`,
      data: { race: params.race, availableRaces: playerOptions.races.map((r) => r.id) },
    };
  }

  const selectedClass = playerOptions.classes.find((c) => c.id === params.class || c.name === params.class);
  if (!selectedClass) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Classe "${params.class}" não encontrada nas opções disponíveis`,
      data: { class: params.class, availableClasses: playerOptions.classes.map((c) => c.id) },
    };
  }

  const levelOneAttacks = (selectedClass.attacks || []).filter((attack) => (attack.level ?? STARTING_LEVEL) === STARTING_LEVEL);
  const levelOneSpells = (selectedClass.spells || []).filter((spell) => (spell.level ?? STARTING_LEVEL) === STARTING_LEVEL);

  const attacksToSelect = selectedClass.selectionRules.attacksToSelect;
  const spellsToSelect = selectedClass.selectionRules.spellsToSelect;
  const selectedAttackIds = params.selectedAttackIds || [];
  const selectedSpellIds = params.selectedSpellIds || [];

  if (attacksToSelect > 0 && selectedAttackIds.length !== attacksToSelect) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Deve selecionar exatamente ${attacksToSelect} ataques`,
      data: { expected: attacksToSelect, received: selectedAttackIds.length },
    };
  }

  if (spellsToSelect > 0 && selectedSpellIds.length !== spellsToSelect) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Deve selecionar exatamente ${spellsToSelect} magias`,
      data: { expected: spellsToSelect, received: selectedSpellIds.length },
    };
  }

  const selectedAttacks: SelectedAttack[] = [];
  for (const attackId of selectedAttackIds) {
    const attack = levelOneAttacks.find((a) => a.id === attackId);
    if (!attack) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: `Ataque "${attackId}" não disponível para personagens de nível 1 na classe ${selectedClass.name}`,
        data: { attackId, availableAttacks: levelOneAttacks.map((a) => a.id) },
      };
    }
    selectedAttacks.push({
      id: attack.id,
      name: attack.name,
      damage: attack.damage,
      description: attack.description,
      cooldown: attack.cooldown,
    });
  }

  const selectedSpells: SelectedSpell[] = [];
  for (const spellId of selectedSpellIds) {
    const spell = levelOneSpells.find((s) => s.id === spellId);
    if (!spell) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: `Magia "${spellId}" não disponível para personagens de nível 1 na classe ${selectedClass.name}`,
        data: { spellId, availableSpells: levelOneSpells.map((s) => s.id) },
      };
    }
    selectedSpells.push({
      id: spell.id,
      name: spell.name,
      damage: spell.damage,
      usageLimit: spell.usageLimit,
      effects: spell.effects,
      description: spell.description,
    });
  }

  const racialBonuses = selectedRace.abilityScoreIncrease || {};
  const level1ClassBonuses = selectedClass.attributeBonusPerLevel.find((b) => b.level === 1) || {
    level: 1,
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };

  const finalAttributes = calculateFinalAttributes(params.attributes, racialBonuses, level1ClassBonuses);

  const character: Character = {
    id: uuidv4(),
    name: params.name,
    race: selectedRace.name,
    class: selectedClass.name,
    subclass: params.subclass,
    attributes: finalAttributes,
    background: params.background,
    equipment: params.equipment,
    selectedAttacks: selectedAttacks.length > 0 ? selectedAttacks : undefined,
    selectedSpells: selectedSpells.length > 0 ? selectedSpells : undefined,
    cantrips: params.cantrips,
    knownSpells: params.knownSpells,
    preparedSpells: params.preparedSpells,
    sheet: params.sheet,
    userId,
    sessionId,
    isComplete: true,
    createdAt: new Date().toISOString(),
  };

  const created = characterStore.createCharacter(character);

  logInfo('[CHARACTER] Personagem criado com sucesso', {
    characterId: created.id,
    characterName: created.name,
    userId,
    sessionId,
    finalAttributes,
    attacksCount: selectedAttacks.length,
    spellsCount: selectedSpells.length,
  });

  if (sessionId) {
    const session = sessionStore.findById(sessionId)!;
    const updatedParticipants = session.participants.map((p) =>
      p.userId === userId
        ? { ...p, hasCreatedCharacter: true, characterId: created.id, characterName: created.name }
        : p
    );

    const updatedSession = sessionStore.updateSession(sessionId, {
      participants: updatedParticipants,
    });

    logInfo('[CHARACTER] Participante atualizado na sessão', {
      sessionId,
      userId,
      characterId: created.id,
      characterName: created.name
    });

    const characterCreatedUpdate: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'CHARACTER_CREATED',
      timestamp: new Date().toISOString(),
      sessionId,
      data: {
        characterId: created.id,
        characterName: created.name,
        userId,
        username: decoded.username,
        race: created.race,
        class: created.class,
        isComplete: true,
      },
    };
    eventStore.addUpdate(characterCreatedUpdate);

    if (updatedSession) {
      const allReady = updatedSession.participants.every((p) => p.hasCreatedCharacter);
      if (allReady) {
        const allReadyUpdate: GameUpdate = {
          id: `update_${uuidv4()}`,
          type: 'ALL_CHARACTERS_READY',
          timestamp: new Date().toISOString(),
          sessionId,
          data: {
            canStart: true,
            participantCount: updatedSession.participants.length,
          },
        };
        eventStore.addUpdate(allReadyUpdate);
      }
    }
  }

  const { userId: characterUserId, ...response } = created;
  void characterUserId;
  return response;
}

export async function getMyCharacters(params: GetCharacters): Promise<CharactersList> {
  const decoded = verifyToken(params.token);

  logInfo('[CHARACTER] Buscando personagens do usuário', { userId: decoded.userId });

  const characters = characterStore.findByUserId(decoded.userId);

  const charactersWithoutUserId = characters.map(({ userId: charUserId, ...rest }) => {
    void charUserId;
    return rest;
  });

  logInfo('[CHARACTER] Personagens encontrados', { 
    userId: decoded.userId, 
    total: characters.length 
  });

  return {
    characters: charactersWithoutUserId,
    total: characters.length,
  };
}

export async function getCharacter(params: GetCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);

  logInfo('[CHARACTER] Buscando personagem', { 
    characterId: params.characterId, 
    userId: decoded.userId 
  });

  const character = characterStore.findById(params.characterId);

  if (!character) {
    logWarning('[CHARACTER] Personagem não encontrado', { 
      characterId: params.characterId 
    });
    throw {
      ...JSON_RPC_ERRORS.NOT_FOUND,
      message: 'Personagem não encontrado',
    };
  }

  const isOwner = character.userId === decoded.userId;
  let canViewCharacter = isOwner;

  if (!isOwner) {
    if (character.sessionId) {
      const session = sessionStore.findById(character.sessionId);
      const isSameSessionParticipant = session?.participants?.some(
        (participant) => participant.userId === decoded.userId
      );
      if (isSameSessionParticipant) {
        canViewCharacter = true;
      }
    }
  }

  if (!canViewCharacter) {
    logWarning('[CHARACTER] Acesso negado ao personagem', { 
      characterId: params.characterId, 
      userId: decoded.userId, 
      ownerId: character.userId 
    });
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Você não tem permissão para visualizar este personagem',
    };
  }

  logInfo('[CHARACTER] Personagem encontrado', { 
    characterId: character.id, 
    characterName: character.name 
  });

  const { userId: charUserId2, ...response } = character;
  void charUserId2;
  return response;
}

export async function updateCharacter(params: UpdateCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);

  logInfo('[CHARACTER] Atualizando personagem', { 
    characterId: params.characterId, 
    userId: decoded.userId 
  });

  const character = characterStore.findById(params.characterId);

  if (!character) {
    logWarning('[CHARACTER] Personagem não encontrado para atualização', { 
      characterId: params.characterId 
    });
    throw {
      ...JSON_RPC_ERRORS.NOT_FOUND,
      message: 'Personagem não encontrado',
    };
  }

  if (character.userId !== decoded.userId) {
    logWarning('[CHARACTER] Acesso negado para atualização', { 
      characterId: params.characterId, 
      userId: decoded.userId 
    });
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Você não tem permissão para editar este personagem',
    };
  }

  let session = null;
  if (character.sessionId) {
    session = sessionStore.findById(character.sessionId) || null;
    if (session && (session.status === 'IN_PROGRESS' || session.status === 'COMPLETED')) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Não é possível editar personagem de sessão em andamento ou finalizada',
        data: { sessionStatus: session.status },
      };
    }
  }

  let storyId = params.storyId || null;
  if (!storyId && session) {
    storyId = session.storyId;
  }

  let playerOptions: { races: Race[]; classes: Class[] } | null = null;
  if (storyId) {
    const playerOptionsPath = path.join(STORIES_DIR, storyId, 'player-options.json');
    if (!fs.existsSync(playerOptionsPath)) {
      logWarning('[CHARACTER] Opções de personagem não encontradas para história durante atualização', {
        storyId,
        path: playerOptionsPath,
      });
    } else {
      try {
        const fileContent = fs.readFileSync(playerOptionsPath, 'utf-8');
        playerOptions = JSON.parse(fileContent);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        logWarning('[CHARACTER] Falha ao carregar opções de personagem para atualização', {
          storyId,
          error: message,
        });
      }
    }
  }

  const nextRaceValue = params.race ?? character.race;
  const nextClassValue = params.class ?? character.class;

  let selectedRaceOption: Race | undefined;
  let selectedClassOption: Class | undefined;

  if (playerOptions) {
    selectedRaceOption = playerOptions.races.find((race) => race.id === nextRaceValue || race.name === nextRaceValue);
    selectedClassOption = playerOptions.classes.find(
      (charClass) => charClass.id === nextClassValue || charClass.name === nextClassValue
    );

    if (!selectedRaceOption) {
      logWarning('[CHARACTER] Raça não encontrada para atualização', {
        requestedRace: nextRaceValue,
        storyId,
      });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: `Raça "${nextRaceValue}" não encontrada nas opções disponíveis`,
      };
    }

    if (!selectedClassOption) {
      logWarning('[CHARACTER] Classe não encontrada para atualização', {
        requestedClass: nextClassValue,
        storyId,
      });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: `Classe "${nextClassValue}" não encontrada nas opções disponíveis`,
      };
    }
  }

  const updates: Partial<Character> = {};

  if (params.name) {
    updates.name = params.name;
  }

  if (selectedRaceOption) {
    updates.race = selectedRaceOption.name;
  } else if (params.race) {
    updates.race = params.race;
  }

  if (selectedClassOption) {
    updates.class = selectedClassOption.name;
  } else if (params.class) {
    updates.class = params.class;
  }

  if (params.background) {
    updates.background = params.background;
  }

  if (params.equipment) {
    updates.equipment = params.equipment;
  }

  if (params.sheet) {
    updates.sheet = {
      ...character.sheet,
      ...params.sheet,
    };
  }

  if (params.attributes) {
    if (selectedRaceOption && selectedClassOption) {
      const racialBonuses = selectedRaceOption.abilityScoreIncrease || {};
      const level1ClassBonuses =
        selectedClassOption.attributeBonusPerLevel.find((b) => b.level === STARTING_LEVEL) || {
          level: STARTING_LEVEL,
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0,
        };
      updates.attributes = calculateFinalAttributes(params.attributes, racialBonuses, level1ClassBonuses);
    } else {
      updates.attributes = params.attributes;
    }
  }

  if (params.selectedAttackIds && selectedClassOption) {
    const levelOneAttacks = (selectedClassOption.attacks || []).filter(
      (attack) => (attack.level ?? STARTING_LEVEL) === STARTING_LEVEL
    );
    const selectedAttacks: SelectedAttack[] = [];

    for (const attackId of params.selectedAttackIds) {
      const attack = levelOneAttacks.find((a) => a.id === attackId);
      if (!attack) {
        throw {
          ...JSON_RPC_ERRORS.SERVER_ERROR,
          message: `Ataque "${attackId}" não disponível para personagens de nível ${STARTING_LEVEL} na classe ${selectedClassOption.name}`,
          data: { attackId, availableAttacks: levelOneAttacks.map((a) => a.id) },
        };
      }
      selectedAttacks.push({
        id: attack.id,
        name: attack.name,
        damage: attack.damage,
        description: attack.description,
        cooldown: attack.cooldown,
      });
    }

    updates.selectedAttacks = selectedAttacks.length > 0 ? selectedAttacks : undefined;
  }

  if (params.selectedSpellIds && selectedClassOption) {
    const levelOneSpells = (selectedClassOption.spells || []).filter(
      (spell) => (spell.level ?? STARTING_LEVEL) === STARTING_LEVEL
    );
    const selectedSpells: SelectedSpell[] = [];

    for (const spellId of params.selectedSpellIds) {
      const spell = levelOneSpells.find((s) => s.id === spellId);
      if (!spell) {
        throw {
          ...JSON_RPC_ERRORS.SERVER_ERROR,
          message: `Magia "${spellId}" não disponível para personagens de nível ${STARTING_LEVEL} na classe ${selectedClassOption.name}`,
          data: { spellId, availableSpells: levelOneSpells.map((s) => s.id) },
        };
      }
      selectedSpells.push({
        id: spell.id,
        name: spell.name,
        damage: spell.damage,
        usageLimit: spell.usageLimit,
        effects: spell.effects,
        description: spell.description,
      });
    }

    updates.selectedSpells = selectedSpells.length > 0 ? selectedSpells : undefined;
  }

  const updated = characterStore.updateCharacter(params.characterId, updates);

  if (!updated) {
    logWarning('[CHARACTER] Erro ao atualizar personagem', { 
      characterId: params.characterId 
    });
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao atualizar personagem',
    };
  }

  if (session) {
    const updatedParticipants = session.participants.map((participant) =>
      participant.userId === decoded.userId
        ? { ...participant, characterName: updated.name }
        : participant
    );
    sessionStore.updateSession(session.id, { participants: updatedParticipants });

    const characterUpdatedEvent: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'CHARACTER_UPDATED',
      timestamp: new Date().toISOString(),
      sessionId: session.id,
      data: {
        characterId: updated.id,
        characterName: updated.name,
        userId: decoded.userId,
        race: updated.race,
        class: updated.class,
      },
    };
    eventStore.addUpdate(characterUpdatedEvent);
  }

  logInfo('[CHARACTER] Personagem atualizado com sucesso', { 
    characterId: updated.id, 
    characterName: updated.name 
  });

  const { userId: charUserId3, ...response } = updated;
  void charUserId3;
  return response;
}

export async function deleteCharacter(params: DeleteCharacter): Promise<DeleteCharacterResponse> {
  const decoded = verifyToken(params.token);

  logInfo('[CHARACTER] Deletando personagem', { 
    characterId: params.characterId, 
    userId: decoded.userId 
  });

  const character = characterStore.findById(params.characterId);

  if (!character) {
    throw {
      ...JSON_RPC_ERRORS.NOT_FOUND,
      message: 'Personagem não encontrado',
    };
  }

  if (character.userId !== decoded.userId) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Você não tem permissão para excluir este personagem',
    };
  }

  if (character.sessionId) {
    const sessionStore = await import('../stores/session_store.js');
    const session = sessionStore.findById(character.sessionId);

    if (session && (session.status === 'IN_PROGRESS' || session.status === 'COMPLETED')) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Não é possível excluir personagem de sessão em andamento ou finalizada',
        data: { sessionStatus: session.status },
      };
    }
  }

  const success = characterStore.deleteCharacter(params.characterId);

  if (!success) {
    logWarning('[CHARACTER] Erro ao excluir personagem', { 
      characterId: params.characterId 
    });
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao excluir personagem',
    };
  }

  logInfo('[CHARACTER] Personagem excluído com sucesso', { 
    characterId: params.characterId, 
    userId: decoded.userId 
  });

  return {
    success: true,
    message: 'Personagem excluído com sucesso',
  };
}
