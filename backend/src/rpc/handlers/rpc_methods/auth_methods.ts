import { RegisterSchema, LoginSchema } from '../../../models/auth_schemas.js';
import { JSON_RPC_ERRORS } from '../../../models/jsonrpc_schemas.js';
import * as authService from '../../../services/auth_service.js';

type RpcMethod = (params: any, context?: any) => Promise<any>;

export const authMethods: Record<string, RpcMethod> = {
  register: async (params) => {
    const validated = RegisterSchema.parse(params);
    return await authService.register(validated);
  },

  login: async (params) => {
    const validated = LoginSchema.parse(params);
    return await authService.login(validated);
  },

  me: async (params, context) => {
    if (!params?.token) {
      throw {
        ...JSON_RPC_ERRORS.UNAUTHORIZED,
        message: 'Token não fornecido',
      };
    }
    return await authService.me(params.token);
  },

  validateToken: async (params) => {
    if (!params?.token) {
      throw {
        ...JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Token é obrigatório',
      };
    }
    return await authService.validateToken({ token: params.token });
  },
};
