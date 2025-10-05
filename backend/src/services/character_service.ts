import { v4 as uuidv4 } from 'uuid';
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
} from '../models/character_schemas.js';

export async function createCharacter(params: CreateCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);
  const userId = decoded.userId;

  logInfo('[CHARACTER] Iniciando criação de personagem', { 
    userId, 
    characterName: params.name, 
    sessionId: params.sessionId 
  });

  let sessionId: string | null = null;

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

    if (session.status !== 'CREATING_CHARACTERS') {
      logWarning('[CHARACTER] Sessão em estado inválido', { 
        sessionId: params.sessionId, 
        currentStatus: session.status,
        userId 
      });
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'A sessão deve estar no estado CREATING_CHARACTERS para criar personagens',
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
  }

  const character: Character = {
    id: uuidv4(),
    name: params.name,
    race: params.race,
    class: params.class,
    attributes: params.attributes,
    background: params.background,
    equipment: params.equipment,
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
    sessionId 
  });

  if (sessionId) {
    const session = sessionStore.findById(sessionId)!;
    const updatedParticipants = session.participants.map((p) =>
      p.userId === userId ? { ...p, hasCreatedCharacter: true, characterId: created.id } : p
    );

    const updatedSession = sessionStore.updateSession(sessionId, {
      participants: updatedParticipants,
    });

    logInfo('[CHARACTER] Participante atualizado na sessão', { 
      sessionId, 
      userId, 
      characterId: created.id 
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

  if (character.userId !== decoded.userId) {
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

  if (character.sessionId) {
    const sessionStore = await import('../stores/session_store.js');
    const session = sessionStore.findById(character.sessionId);

    if (session && (session.status === 'IN_PROGRESS' || session.status === 'COMPLETED')) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Não é possível editar personagem de sessão em andamento ou finalizada',
        data: { sessionStatus: session.status },
      };
    }
  }

  const updates: Partial<Character> = {};

  if (params.name) updates.name = params.name;
  if (params.race) updates.race = params.race;
  if (params.class) updates.class = params.class;
  if (params.attributes) updates.attributes = params.attributes;
  if (params.background) updates.background = params.background;
  if (params.equipment) updates.equipment = params.equipment;

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
