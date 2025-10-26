import * as gameService from '../../../services/game_service.js';
import {
  GetGameStateSchema,
  GetTimelineSchema,
  RevertChapterSchema,
  type GetGameState,
  type GetTimeline,
  type RevertChapter,
  type GameStateResponse,
  type TimelineResponse,
  type RevertChapterResponse,
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

  revertChapter: async (params: unknown): Promise<RevertChapterResponse> => {
    const validated = RevertChapterSchema.parse(params) as RevertChapter;
    return await gameService.revertToPreviousChapter(validated);
  },
};
