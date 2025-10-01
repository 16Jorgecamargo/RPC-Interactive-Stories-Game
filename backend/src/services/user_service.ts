import { verifyToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import * as userStore from '../stores/user_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import { UserResponse } from '../models/auth_schemas.js';
import {
  GetMe,
  UpdateProfile,
  ChangePassword,
  ChangePasswordResponse,
  UpdateProfileResponse,
} from '../models/user_schemas.js';

export async function getMe(params: GetMe): Promise<UserResponse> {
  const decoded = verifyToken(params.token);

  const user = userStore.findById(decoded.userId);
  if (!user) {
    throw { ...JSON_RPC_ERRORS.UNAUTHORIZED, message: 'Usuário não encontrado' };
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateProfile(params: UpdateProfile): Promise<UpdateProfileResponse> {
  const decoded = verifyToken(params.token);

  if (params.username) {
    const existingUser = userStore.findByUsername(params.username);
    if (existingUser && existingUser.id !== decoded.userId) {
      throw {
        ...JSON_RPC_ERRORS.SERVER_ERROR,
        message: 'Nome de usuário já está em uso',
      };
    }
  }

  const updates: any = {};
  if (params.username) {
    updates.username = params.username;
  }

  const updatedUser = userStore.updateUser(decoded.userId, updates);
  if (!updatedUser) {
    throw { ...JSON_RPC_ERRORS.UNAUTHORIZED, message: 'Usuário não encontrado' };
  }

  return {
    success: true,
    message: 'Perfil atualizado com sucesso',
  };
}

export async function changePassword(params: ChangePassword): Promise<ChangePasswordResponse> {
  const decoded = verifyToken(params.token);

  if (params.newPassword !== params.confirmPassword) {
    throw {
      ...JSON_RPC_ERRORS.INVALID_PARAMS,
      message: 'As senhas não coincidem',
    };
  }

  const user = userStore.findById(decoded.userId);
  if (!user) {
    throw { ...JSON_RPC_ERRORS.UNAUTHORIZED, message: 'Usuário não encontrado' };
  }

  const isValid = await comparePassword(params.currentPassword, user.password);
  if (!isValid) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Senha atual incorreta',
    };
  }

  const newPasswordHash = await hashPassword(params.newPassword);
  const success = userStore.updatePassword(decoded.userId, newPasswordHash);

  if (!success) {
    throw {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: 'Erro ao atualizar senha',
    };
  }

  return {
    success: true,
    message: 'Senha alterada com sucesso',
  };
}
