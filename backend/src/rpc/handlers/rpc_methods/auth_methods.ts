import { z } from 'zod';
import * as authService from '../../../services/auth_service.js';
import {
  RegisterSchema,
  LoginSchema,
  ValidateTokenSchema,
  type RegisterResponse,
  type LoginResponse,
  type ValidateTokenResponse,
} from '../../../models/auth_schemas.js';

export const authMethods = {
  register: async (params: unknown): Promise<RegisterResponse> => {
    const validated = RegisterSchema.parse(params) as z.infer<typeof RegisterSchema>;
    return await authService.register(validated);
  },

  login: async (params: unknown): Promise<LoginResponse> => {
    const validated = LoginSchema.parse(params) as z.infer<typeof LoginSchema>;
    return await authService.login(validated);
  },

  validateToken: async (params: unknown): Promise<ValidateTokenResponse> => {
    const validated = ValidateTokenSchema.parse(params) as z.infer<typeof ValidateTokenSchema>;
    return await authService.validateToken(validated);
  },
};
