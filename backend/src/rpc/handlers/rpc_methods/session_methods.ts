import * as sessionService from '../../../services/session_service.js';
import {
  CreateSessionSchema,
  JoinSessionSchema,
  GetSessionsSchema,
  GetSessionDetailsSchema,
  DeleteSessionSchema,
  LeaveSessionSchema,
} from '../../../models/session_schemas.js';

type RpcMethod = (params: any) => Promise<any>;

export const sessionMethods: Record<string, RpcMethod> = {
  createSession: async (params) => {
    const validated = CreateSessionSchema.parse(params);
    return await sessionService.createSession(validated);
  },

  joinSession: async (params) => {
    const validated = JoinSessionSchema.parse(params);
    return await sessionService.joinSession(validated);
  },

  listMySessions: async (params) => {
    const validated = GetSessionsSchema.parse(params);
    return await sessionService.listMySessions(validated);
  },

  getSessionDetails: async (params) => {
    const validated = GetSessionDetailsSchema.parse(params);
    return await sessionService.getSessionDetails(validated);
  },

  deleteSession: async (params) => {
    const validated = DeleteSessionSchema.parse(params);
    return await sessionService.deleteSession(validated);
  },

  leaveSession: async (params) => {
    const validated = LeaveSessionSchema.parse(params);
    return await sessionService.leaveSession(validated);
  },
};
