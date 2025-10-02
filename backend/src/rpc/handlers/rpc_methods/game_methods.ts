import * as gameService from '../../../services/game_service.js';
import {
  GetGameStateSchema,
  GetTimelineSchema,
  type GetGameState,
  type GetTimeline,
  type GameStateResponse,
  type TimelineResponse,
} from '../../../models/game_schemas.js';

export const gameMethods = {
  getGameState: async (params: unknown): Promise<GameStateResponse> => {
    const validated = GetGameStateSchema.parse(params) as GetGameState;
    return await gameService.getGameState(validated);
  },

  getTimelineHistory: async (params: unknown): Promise<TimelineResponse> => {
    const validated = GetTimelineSchema.parse(params) as GetTimeline;
    return await gameService.getTimelineHistory(validated);
  },
};
