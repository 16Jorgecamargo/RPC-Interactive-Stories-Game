import { verifyToken } from './jwt.js';
import { findById as findUserById } from '../stores/user_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';

export interface ValidatedUser {
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export function validateToken(token: string): ValidatedUser {
  const payload = verifyToken(token);
  const user = findUserById(payload.userId);

  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.UNAUTHORIZED,
      message: 'Usuário não encontrado',
      data: { userId: payload.userId },
    };
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
}

export function validateAdmin(token: string): ValidatedUser {
  const user = validateToken(token);

  if (user.role !== 'ADMIN') {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Acesso negado: privilégios de administrador necessários',
      data: { userId: user.userId },
    };
  }

  return user;
}

export function validateOwnership(
  userId: string,
  resourceUserId: string,
  resourceType: string,
  resourceId: string
): void {
  if (userId !== resourceUserId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: `Você não tem permissão para acessar este ${resourceType}`,
      data: { userId, resourceId },
    };
  }
}

export function validateSessionParticipant(
  userId: string,
  participants: Array<{ userId: string }>,
  sessionId: string
): void {
  const isParticipant = participants.some((p) => p.userId === userId);

  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { userId, sessionId },
    };
  }
}

export function validateResourceExists<T>(
  resource: T | null | undefined,
  resourceType: string,
  resourceId: string
): asserts resource is T {
  if (!resource) {
    throw {
      ...JSON_RPC_ERRORS.NOT_FOUND,
      message: `${resourceType} não encontrado`,
      data: { resourceId },
    };
  }
}
