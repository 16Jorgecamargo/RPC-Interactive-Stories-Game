import { z } from 'zod';
import * as sessionService from '../../../services/session_service.js';
import {
  CreateSessionSchema,
  JoinSessionSchema,
  GetSessionsSchema,
  GetSessionDetailsSchema,
  DeleteSessionSchema,
  LeaveSessionSchema,
  TransitionToCreatingCharactersSchema,
  CanStartSessionSchema,
  StartSessionSchema,
  EnterRoomSchema,
  LeaveRoomSchema,
} from '../../../models/session_schemas.js';

export const sessionMethods = {
  createSession: async (params: unknown) => {
    const validated = CreateSessionSchema.parse(params) as z.infer<typeof CreateSessionSchema>;
    return await sessionService.createSession(validated);
  },

  joinSession: async (params: unknown) => {
    const validated = JoinSessionSchema.parse(params) as z.infer<typeof JoinSessionSchema>;
    return await sessionService.joinSession(validated);
  },

  listMySessions: async (params: unknown) => {
    const validated = GetSessionsSchema.parse(params) as z.infer<typeof GetSessionsSchema>;
    return await sessionService.listMySessions(validated);
  },

  getSessionDetails: async (params: unknown) => {
    const validated = GetSessionDetailsSchema.parse(params) as z.infer<typeof GetSessionDetailsSchema>;
    return await sessionService.getSessionDetails(validated);
  },

  deleteSession: async (params: unknown) => {
    const validated = DeleteSessionSchema.parse(params) as z.infer<typeof DeleteSessionSchema>;
    return await sessionService.deleteSession(validated);
  },

  leaveSession: async (params: unknown) => {
    const validated = LeaveSessionSchema.parse(params) as z.infer<typeof LeaveSessionSchema>;
    return await sessionService.leaveSession(validated);
  },

  transitionToCreatingCharacters: async (params: unknown) => {
    const validated = TransitionToCreatingCharactersSchema.parse(params) as z.infer<typeof TransitionToCreatingCharactersSchema>;
    return await sessionService.transitionToCreatingCharacters(validated);
  },

  canStartSession: async (params: unknown) => {
    const validated = CanStartSessionSchema.parse(params) as z.infer<typeof CanStartSessionSchema>;
    return await sessionService.canStartSession(validated);
  },

  startSession: async (params: unknown) => {
    const validated = StartSessionSchema.parse(params) as z.infer<typeof StartSessionSchema>;
    return await sessionService.startSession(validated);
  },

  enterRoom: async (params: unknown) => {
    const validated = EnterRoomSchema.parse(params) as z.infer<typeof EnterRoomSchema>;
    return await sessionService.enterRoom(validated);
  },

  leaveRoom: async (params: unknown) => {
    const validated = LeaveRoomSchema.parse(params) as z.infer<typeof LeaveRoomSchema>;
    return await sessionService.leaveRoom(validated);
  },
};
