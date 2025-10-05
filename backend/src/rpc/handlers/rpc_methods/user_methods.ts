import { z } from 'zod';
import { GetMeSchema, UpdateProfileSchema, ChangePasswordSchema } from '../../../models/user_schemas.js';
import * as userService from '../../../services/user_service.js';

export const userMethods = {
  me: async (params: unknown) => {
    const validated = GetMeSchema.parse(params) as z.infer<typeof GetMeSchema>;
    return await userService.getMe(validated);
  },

  updateProfile: async (params: unknown) => {
    const validated = UpdateProfileSchema.parse(params) as z.infer<typeof UpdateProfileSchema>;
    return await userService.updateProfile(validated);
  },

  changePassword: async (params: unknown) => {
    const validated = ChangePasswordSchema.parse(params) as z.infer<typeof ChangePasswordSchema>;
    return await userService.changePassword(validated);
  },
};
