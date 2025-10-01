import * as characterService from '../../../services/character_service.js';
import {
  CreateCharacterSchema,
  GetCharactersSchema,
  GetCharacterSchema,
  UpdateCharacterSchema,
  DeleteCharacterSchema,
} from '../../../models/character_schemas.js';

type RpcMethod = (params: any) => Promise<any>;

export const characterMethods: Record<string, RpcMethod> = {
  createCharacter: async (params) => {
    const validated = CreateCharacterSchema.parse(params);
    return await characterService.createCharacter(validated);
  },

  getMyCharacters: async (params) => {
    const validated = GetCharactersSchema.parse(params);
    return await characterService.getMyCharacters(validated);
  },

  getCharacter: async (params) => {
    const validated = GetCharacterSchema.parse(params);
    return await characterService.getCharacter(validated);
  },

  updateCharacter: async (params) => {
    const validated = UpdateCharacterSchema.parse(params);
    return await characterService.updateCharacter(validated);
  },

  deleteCharacter: async (params) => {
    const validated = DeleteCharacterSchema.parse(params);
    return await characterService.deleteCharacter(validated);
  },
};
