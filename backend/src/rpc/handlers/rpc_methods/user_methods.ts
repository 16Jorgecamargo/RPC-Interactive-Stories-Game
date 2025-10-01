import { GetMeSchema, UpdateProfileSchema, ChangePasswordSchema } from '../../../models/user_schemas.js';
import * as userService from '../../../services/user_service.js';

type RpcMethod = (params: any) => Promise<any>;

export const userMethods: Record<string, RpcMethod> = {
  me: async (params) => {
    const validated = GetMeSchema.parse(params);
    return await userService.getMe(validated);
  },

  updateProfile: async (params) => {
    const validated = UpdateProfileSchema.parse(params);
    return await userService.updateProfile(validated);
  },

  changePassword: async (params) => {
    const validated = ChangePasswordSchema.parse(params);
    return await userService.changePassword(validated);
  },
};
