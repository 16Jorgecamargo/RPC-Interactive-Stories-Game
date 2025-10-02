import { z } from 'zod';
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

export const characterMethods = {
  getCharacterOptions: async (params: unknown) => {
    const validated = GetCharacterOptionsSchema.parse(params) as z.infer<typeof GetCharacterOptionsSchema>;
    return await characterOptionsService.getCharacterOptions(validated);
  },

  createCharacter: async (params: unknown) => {
    const validated = CreateCharacterSchema.parse(params) as z.infer<typeof CreateCharacterSchema>;
    return await characterService.createCharacter(validated);
  },

  getMyCharacters: async (params: unknown) => {
    const validated = GetCharactersSchema.parse(params) as z.infer<typeof GetCharactersSchema>;
    return await characterService.getMyCharacters(validated);
  },

  getCharacter: async (params: unknown) => {
    const validated = GetCharacterSchema.parse(params) as z.infer<typeof GetCharacterSchema>;
    return await characterService.getCharacter(validated);
  },

  updateCharacter: async (params: unknown) => {
    const validated = UpdateCharacterSchema.parse(params) as z.infer<typeof UpdateCharacterSchema>;
    return await characterService.updateCharacter(validated);
  },

  deleteCharacter: async (params: unknown) => {
    const validated = DeleteCharacterSchema.parse(params) as z.infer<typeof DeleteCharacterSchema>;
    return await characterService.deleteCharacter(validated);
  },
};
