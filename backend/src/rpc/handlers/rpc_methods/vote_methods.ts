import * as voteService from '../../../services/vote_service.js';
import {
  SubmitVoteSchema,
  GetVoteStatusSchema,
  ResolveTieSchema,
  type SubmitVote,
  type GetVoteStatus,
  type ResolveTie,
  type SubmitVoteResponse,
  type VoteStatusResponse,
  type ResolveTieResponse,
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
};
