import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import * as characterStore from '../stores/character_store.js';
import * as sessionStore from '../stores/session_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
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

  let sessionId: string | null = null;

  if (params.sessionId) {
    const session = sessionStore.findById(params.sessionId);
    
    if (!session) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Sessão não encontrada',
        data: { sessionId: params.sessionId },
      };
    }

    if (session.status !== 'CREATING_CHARACTERS') {
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

  if (sessionId) {
    const session = sessionStore.findById(sessionId)!;
    const updatedParticipants = session.participants.map((p) =>
      p.userId === userId ? { ...p, hasCreatedCharacter: true } : p
    );

    sessionStore.updateSession(sessionId, {
      participants: updatedParticipants,
    });
  }

  const { userId: characterUserId, ...response } = created;
  void characterUserId;
  return response;
}

export async function getMyCharacters(params: GetCharacters): Promise<CharactersList> {
  const decoded = verifyToken(params.token);

  const characters = characterStore.findByUserId(decoded.userId);

  const charactersWithoutUserId = characters.map(({ userId: charUserId, ...rest }) => {
    void charUserId;
    return rest;
  });

  return {
    characters: charactersWithoutUserId,
    total: characters.length,
  };
}

export async function getCharacter(params: GetCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);

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
      message: 'Você não tem permissão para visualizar este personagem',
    };
  }

  const { userId: charUserId2, ...response } = character;
  void charUserId2;
  return response;
}

export async function updateCharacter(params: UpdateCharacter): Promise<CharacterResponse> {
  const decoded = verifyToken(params.token);

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
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao atualizar personagem',
    };
  }

  const { userId: charUserId3, ...response } = updated;
  void charUserId3;
  return response;
}

export async function deleteCharacter(params: DeleteCharacter): Promise<DeleteCharacterResponse> {
  const decoded = verifyToken(params.token);

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
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao excluir personagem',
    };
  }

  return {
    success: true,
    message: 'Personagem excluído com sucesso',
  };
}
