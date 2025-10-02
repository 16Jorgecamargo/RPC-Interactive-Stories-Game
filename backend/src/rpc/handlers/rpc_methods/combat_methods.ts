import * as combatService from '../../../services/combat_service.js';
import {
  InitiateCombatSchema,
  GetCombatStateSchema,
  type InitiateCombat,
  type GetCombatState,
  type InitiateCombatResponse,
  type GetCombatStateResponse,
} from '../../../models/combat_schemas.js';

export const combatMethods = {
  initiateCombat: async (params: unknown): Promise<InitiateCombatResponse> => {
    const validated = InitiateCombatSchema.parse(params) as InitiateCombat;
    return await combatService.initiateCombat(validated);
  },

  getCombatState: async (params: unknown): Promise<GetCombatStateResponse> => {
    const validated = GetCombatStateSchema.parse(params) as GetCombatState;
    return await combatService.getCombatState(validated);
  },
};
