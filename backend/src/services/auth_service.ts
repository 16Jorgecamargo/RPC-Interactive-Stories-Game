import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken, verifyToken, getExpiresInSeconds } from '../utils/jwt.js';
import { createUser, findByUsername, findById, userExists } from '../stores/user_store.js';
import type { User } from '../models/auth_schemas.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import { logInfo, logWarning } from '../utils/logger.js';

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
  const startTime = Date.now();
  logInfo('[AUTH_SERVICE] register() iniciado', { username: params.username });
  
  const { username, password, confirmPassword } = params;

  if (password !== confirmPassword) {
    logWarning('[AUTH] Registro falhou: senhas não coincidem', { username, duration: `${Date.now() - startTime}ms` });
    throw {
      ...JSON_RPC_ERRORS.INVALID_PARAMS,
      data: { field: 'confirmPassword', reason: 'Senhas não coincidem' },
    };
  }

  if (userExists(username)) {
    logWarning('[AUTH] Registro falhou: nome de usuário já existe', { username, duration: `${Date.now() - startTime}ms` });
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário já existe',
      data: { field: 'username', reason: 'Este nome de usuário já está em uso' },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(username, passwordHash);

  logInfo('[AUTH] Usuário registrado com sucesso', { userId: user.id, username, duration: `${Date.now() - startTime}ms` });

  return {
    success: true,
    userId: user.id,
  };
}

export async function login(params: LoginParams): Promise<LoginResult> {
  const startTime = Date.now();
  logInfo('[AUTH_SERVICE] login() iniciado', { username: params.username });
  
  const { username, password } = params;

  const user = findByUsername(username);

  if (!user) {
    logWarning('[AUTH] Login falhou: usuário não encontrado', { username, duration: `${Date.now() - startTime}ms` });
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Credenciais inválidas',
      data: { reason: 'Usuário ou senha incorretos' },
    };
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    logWarning('[AUTH] Login falhou: senha inválida', { username, userId: user.id, duration: `${Date.now() - startTime}ms` });
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

  const { password: _p, ...userWithoutPassword } = user;
  void _p;

  logInfo('[AUTH] Usuário logado com sucesso', { userId: user.id, username, role: user.role, duration: `${Date.now() - startTime}ms` });

  return {
    token,
    user: userWithoutPassword,
    expiresIn: getExpiresInSeconds(),
  };
}

export async function validateToken(params: ValidateTokenParams): Promise<ValidateTokenResult> {
  const startTime = Date.now();
  logInfo('[AUTH_SERVICE] validateToken() iniciado');
  
  const { token } = params;

  try {
    const decoded = verifyToken(token);
    const user = findById(decoded.userId);

    if (!user) {
      logWarning('[AUTH] Token válido mas usuário não encontrado', { userId: decoded.userId, duration: `${Date.now() - startTime}ms` });
      return { valid: false };
    }

    const { password: _pwd2, ...userWithoutPassword } = user;
    void _pwd2;

    logInfo('[AUTH] Token validado com sucesso', { userId: user.id, duration: `${Date.now() - startTime}ms` });
    return {
      valid: true,
      user: userWithoutPassword,
    };
  } catch (_err) {
    logWarning('[AUTH] Token inválido', { duration: `${Date.now() - startTime}ms` });
    return { valid: false };
  }
}

export async function me(token: string): Promise<Omit<User, 'password'>> {
  const startTime = Date.now();
  logInfo('[AUTH_SERVICE] me() iniciado');
  
  try {
    const decoded = verifyToken(token);
    const user = findById(decoded.userId);

    if (!user) {
      logWarning('[AUTH] me() falhou: usuário não encontrado', { userId: decoded.userId, duration: `${Date.now() - startTime}ms` });
      throw {
        ...JSON_RPC_ERRORS.UNAUTHORIZED,
        message: 'Usuário não encontrado',
      };
    }

    const { password: _pwd3, ...userWithoutPassword } = user;
    void _pwd3;
    logInfo('[AUTH] me() concluído com sucesso', { userId: user.id, duration: `${Date.now() - startTime}ms` });
    return userWithoutPassword;
  } catch (_err2) {
    logWarning('[AUTH] me() falhou: token inválido', { duration: `${Date.now() - startTime}ms` });
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Token inválido ou expirado',
    };
  }
}
