import * as combatService from '../../../services/combat_service.js';
import {
  InitiateCombatSchema,
  GetCombatStateSchema,
  RollInitiativeSchema,
  GetCurrentTurnSchema,
  PerformAttackSchema,
  AttemptReviveSchema,
  SkipTurnSchema,
  type InitiateCombat,
  type GetCombatState,
  type InitiateCombatResponse,
  type GetCombatStateResponse,
  type RollInitiative,
  type RollInitiativeResponse,
  type GetCurrentTurn,
  type GetCurrentTurnResponse,
  type PerformAttack,
  type PerformAttackResponse,
  type AttemptRevive,
  type AttemptReviveResponse,
  type SkipTurn,
  type SkipTurnResponse,
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

  rollInitiative: async (params: unknown): Promise<RollInitiativeResponse> => {
    const validated = RollInitiativeSchema.parse(params) as RollInitiative;
    return await combatService.rollInitiative(validated);
  },

  getCurrentTurn: async (params: unknown): Promise<GetCurrentTurnResponse> => {
    const validated = GetCurrentTurnSchema.parse(params) as GetCurrentTurn;
    return await combatService.getCurrentTurn(validated);
  },

  performAttack: async (params: unknown): Promise<PerformAttackResponse> => {
    const validated = PerformAttackSchema.parse(params) as PerformAttack;
    return await combatService.performAttack(validated);
  },

  attemptRevive: async (params: unknown): Promise<AttemptReviveResponse> => {
    const validated = AttemptReviveSchema.parse(params) as AttemptRevive;
    return await combatService.attemptRevive(validated);
  },

  skipTurn: async (params: unknown): Promise<SkipTurnResponse> => {
    const validated = SkipTurnSchema.parse(params) as SkipTurn;
    return await combatService.skipTurn(validated);
  },
};
