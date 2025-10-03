import * as adminService from '../../../services/admin_service.js';
import {
  GetAllUsersSchema,
  DeleteUserSchema,
  PromoteUserSchema,
  DemoteUserSchema,
  type GetAllUsers,
  type GetAllUsersResponse,
  type DeleteUser,
  type DeleteUserResponse,
  type PromoteUser,
  type PromoteUserResponse,
  type DemoteUser,
  type DemoteUserResponse,
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
};
