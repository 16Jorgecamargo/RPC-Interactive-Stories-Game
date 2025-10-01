import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken, verifyToken, getExpiresInSeconds } from '../utils/jwt.js';
import { createUser, findByUsername, findById, userExists } from '../stores/user_store.js';
import type { User } from '../models/auth_schemas.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResult {
  success: boolean;
  userId?: string;
  message?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: Omit<User, 'password'>;
  expiresIn: number;
}

export interface ValidateTokenParams {
  token: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  user?: Omit<User, 'password'>;
}

export async function register(params: RegisterParams): Promise<RegisterResult> {
  const { username, password, confirmPassword } = params;

  if (password !== confirmPassword) {
    throw {
      ...JSON_RPC_ERRORS.INVALID_PARAMS,
      data: { field: 'confirmPassword', reason: 'Senhas não coincidem' },
    };
  }

  if (userExists(username)) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário já existe',
      data: { field: 'username', reason: 'Este nome de usuário já está em uso' },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(username, passwordHash);

  return {
    success: true,
    userId: user.id,
  };
}

export async function login(params: LoginParams): Promise<LoginResult> {
  const { username, password } = params;

  const user = findByUsername(username);

  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Credenciais inválidas',
      data: { reason: 'Usuário ou senha incorretos' },
    };
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Credenciais inválidas',
      data: { reason: 'Usuário ou senha incorretos' },
    };
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
    expiresIn: getExpiresInSeconds(),
  };
}

export async function validateToken(params: ValidateTokenParams): Promise<ValidateTokenResult> {
  const { token } = params;

  try {
    const decoded = verifyToken(token);
    const user = findById(decoded.userId);

    if (!user) {
      return { valid: false };
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      valid: true,
      user: userWithoutPassword,
    };
  } catch (error) {
    return { valid: false };
  }
}

export async function me(token: string): Promise<Omit<User, 'password'>> {
  try {
    const decoded = verifyToken(token);
    const user = findById(decoded.userId);

    if (!user) {
      throw {
        ...JSON_RPC_ERRORS.UNAUTHORIZED,
        message: 'Usuário não encontrado',
      };
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Token inválido ou expirado',
    };
  }
}
