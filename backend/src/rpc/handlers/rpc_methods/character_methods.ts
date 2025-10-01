import * as characterService from '../../../services/character_service.js';
import * as characterOptionsService from '../../../services/character_options_service.js';
import {
  CreateCharacterSchema,
  GetCharactersSchema,
  GetCharacterSchema,
  UpdateCharacterSchema,
  DeleteCharacterSchema,
  GetCharacterOptionsSchema,
} from '../../../models/character_schemas.js';

type RpcMethod = (params: any) => Promise<any>;

export const characterMethods: Record<string, RpcMethod> = {
  getCharacterOptions: async (params) => {
    const validated = GetCharacterOptionsSchema.parse(params);
    return await characterOptionsService.getCharacterOptions(validated);
  },

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
