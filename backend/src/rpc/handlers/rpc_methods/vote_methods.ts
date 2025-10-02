import * as voteService from '../../../services/vote_service.js';
import {
  SubmitVoteSchema,
  GetVoteStatusSchema,
  ResolveTieSchema,
  ConfigureVoteTimeoutSchema,
  GetVoteTimerSchema,
  ExtendVoteTimerSchema,
  type SubmitVote,
  type GetVoteStatus,
  type ResolveTie,
  type ConfigureVoteTimeout,
  type GetVoteTimer,
  type ExtendVoteTimer,
  type SubmitVoteResponse,
  type VoteStatusResponse,
  type ResolveTieResponse,
  type ConfigureVoteTimeoutResponse,
  type GetVoteTimerResponse,
  type ExtendVoteTimerResponse,
} from '../../../models/vote_schemas.js';

export const voteMethods = {
  vote: async (params: unknown): Promise<SubmitVoteResponse> => {
    const validated = SubmitVoteSchema.parse(params) as SubmitVote;
    return await voteService.submitVote(validated);
  },

  getVoteStatus: async (params: unknown): Promise<VoteStatusResponse> => {
    const validated = GetVoteStatusSchema.parse(params) as GetVoteStatus;
    return await voteService.getVotingStatus(validated);
  },

  resolveTie: async (params: unknown): Promise<ResolveTieResponse> => {
    const validated = ResolveTieSchema.parse(params) as ResolveTie;
    return await voteService.resolveTie(validated);
  },

  configureVoteTimeout: async (params: unknown): Promise<ConfigureVoteTimeoutResponse> => {
    const validated = ConfigureVoteTimeoutSchema.parse(params) as ConfigureVoteTimeout;
    return await voteService.configureVoteTimeout(validated);
  },

  getVoteTimer: async (params: unknown): Promise<GetVoteTimerResponse> => {
    const validated = GetVoteTimerSchema.parse(params) as GetVoteTimer;
    return await voteService.getVoteTimer(validated);
  },

  extendVoteTimer: async (params: unknown): Promise<ExtendVoteTimerResponse> => {
    const validated = ExtendVoteTimerSchema.parse(params) as ExtendVoteTimer;
    return await voteService.extendVoteTimer(validated);
  },
};
