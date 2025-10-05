import * as adminService from '../../../services/admin_service.js';
import {
  GetAllUsersSchema,
  DeleteUserSchema,
  PromoteUserSchema,
  DemoteUserSchema,
  GetAllSessionsSchema,
  GetSessionDetailSchema,
  DeleteSessionSchema,
  ForceSessionStateSchema,
  GetSystemStatsSchema,
  GetStoryUsageSchema,
  type GetAllUsers,
  type GetAllUsersResponse,
  type DeleteUser,
  type DeleteUserResponse,
  type PromoteUser,
  type PromoteUserResponse,
  type DemoteUser,
  type DemoteUserResponse,
  type GetAllSessions,
  type GetAllSessionsResponse,
  type GetSessionDetail,
  type GetSessionDetailResponse,
  type DeleteSession,
  type DeleteSessionResponse,
  type ForceSessionState,
  type ForceSessionStateResponse,
  type GetSystemStats,
  type GetSystemStatsResponse,
  type GetStoryUsage,
  type GetStoryUsageResponse,
} from '../../../models/admin_schemas.js';

export const adminMethods = {
  getAllUsers: async (params: unknown): Promise<GetAllUsersResponse> => {
    const validated = GetAllUsersSchema.parse(params) as GetAllUsers;
    return await adminService.getAllUsers(validated);
  },

  deleteUser: async (params: unknown): Promise<DeleteUserResponse> => {
    const validated = DeleteUserSchema.parse(params) as DeleteUser;
    return await adminService.deleteUser(validated);
  },

  promoteUser: async (params: unknown): Promise<PromoteUserResponse> => {
    const validated = PromoteUserSchema.parse(params) as PromoteUser;
    return await adminService.promoteUser(validated);
  },

  demoteUser: async (params: unknown): Promise<DemoteUserResponse> => {
    const validated = DemoteUserSchema.parse(params) as DemoteUser;
    return await adminService.demoteUser(validated);
  },

  getAllSessions: async (params: unknown): Promise<GetAllSessionsResponse> => {
    const validated = GetAllSessionsSchema.parse(params) as GetAllSessions;
    return await adminService.getAllSessions(validated);
  },

  getSessionDetail: async (params: unknown): Promise<GetSessionDetailResponse> => {
    const validated = GetSessionDetailSchema.parse(params) as GetSessionDetail;
    return await adminService.getSessionDetail(validated);
  },

  deleteSession: async (params: unknown): Promise<DeleteSessionResponse> => {
    const validated = DeleteSessionSchema.parse(params) as DeleteSession;
    return await adminService.deleteSession(validated);
  },

  forceSessionState: async (params: unknown): Promise<ForceSessionStateResponse> => {
    const validated = ForceSessionStateSchema.parse(params) as ForceSessionState;
    return await adminService.forceSessionState(validated);
  },

  getSystemStats: async (params: unknown): Promise<GetSystemStatsResponse> => {
    const validated = GetSystemStatsSchema.parse(params) as GetSystemStats;
    return await adminService.getSystemStats(validated);
  },

  getStoryUsage: async (params: unknown): Promise<GetStoryUsageResponse> => {
    const validated = GetStoryUsageSchema.parse(params) as GetStoryUsage;
    return await adminService.getStoryUsage(validated);
  },
};
