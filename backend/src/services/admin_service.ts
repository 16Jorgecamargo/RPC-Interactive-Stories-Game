import * as userStore from '../stores/user_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as characterStore from '../stores/character_store.js';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import type {
  GetAllUsers,
  GetAllUsersResponse,
  DeleteUser,
  DeleteUserResponse,
  PromoteUser,
  PromoteUserResponse,
  DemoteUser,
  DemoteUserResponse,
  UserWithStats,
} from '../models/admin_schemas.js';

function verifyAdmin(token: string): string {
  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const user = userStore.findById(userId);
  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Usuário não encontrado',
      data: { userId },
    };
  }

  if (user.role !== 'ADMIN') {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Acesso negado. Apenas administradores podem executar esta ação',
      data: { userId, role: user.role },
    };
  }

  return userId;
}

export async function getAllUsers(params: GetAllUsers): Promise<GetAllUsersResponse> {
  const { token } = params;

  verifyAdmin(token);

  const allUsers = userStore.getAllUsers();
  const allSessions = sessionStore.findAll();
  const allCharacters = characterStore.findAll();

  const usersWithStats: UserWithStats[] = allUsers.map((user) => {
    const userSessions = allSessions.filter((s) => s.ownerId === user.id);
    const userCharacters = allCharacters.filter((c) => c.userId === user.id);
    const activeSessions = userSessions.filter(
      (s) => s.status === 'IN_PROGRESS' || s.status === 'CREATING_CHARACTERS' || s.status === 'WAITING_PLAYERS'
    );

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.role === 'ADMIN',
      createdAt: user.createdAt,
      stats: {
        totalSessions: userSessions.length,
        totalCharacters: userCharacters.length,
        activeSessions: activeSessions.length,
      },
    };
  });

  return {
    users: usersWithStats,
    total: allUsers.length,
  };
}

export async function deleteUser(params: DeleteUser): Promise<DeleteUserResponse> {
  const { token, userId } = params;

  const adminId = verifyAdmin(token);

  if (adminId === userId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Você não pode excluir sua própria conta',
      data: { userId },
    };
  }

  const user = userStore.findById(userId);
  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário não encontrado',
      data: { userId },
    };
  }

  const userSessions = sessionStore.findAll().filter((s) => s.ownerId === userId);
  const userCharacters = characterStore.findAll().filter((c) => c.userId === userId);

  for (const session of userSessions) {
    sessionStore.deleteSession(session.id);
  }

  for (const character of userCharacters) {
    characterStore.deleteCharacter(character.id);
  }

  userStore.deleteUser(userId);

  return {
    success: true,
    message: `Usuário ${user.username} excluído com sucesso`,
    cascadeInfo: {
      sessionsDeleted: userSessions.length,
      charactersDeleted: userCharacters.length,
    },
  };
}

export async function promoteUser(params: PromoteUser): Promise<PromoteUserResponse> {
  const { token, userId } = params;

  verifyAdmin(token);

  const user = userStore.findById(userId);
  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário não encontrado',
      data: { userId },
    };
  }

  if (user.role === 'ADMIN') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário já é admin',
      data: { userId, username: user.username },
    };
  }

  const updatedUser = userStore.updateUser(userId, { role: 'ADMIN' });
  if (!updatedUser) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Erro ao promover usuário',
      data: { userId },
    };
  }

  return {
    success: true,
    message: `Usuário ${updatedUser.username} promovido a admin com sucesso`,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.role === 'ADMIN',
    },
  };
}

export async function demoteUser(params: DemoteUser): Promise<DemoteUserResponse> {
  const { token, userId } = params;

  const adminId = verifyAdmin(token);

  if (adminId === userId) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Você não pode remover seus próprios privilégios de admin',
      data: { userId },
    };
  }

  const user = userStore.findById(userId);
  if (!user) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário não encontrado',
      data: { userId },
    };
  }

  if (user.role !== 'ADMIN') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Usuário não é admin',
      data: { userId, username: user.username },
    };
  }

  const updatedUser = userStore.updateUser(userId, { role: 'USER' });
  if (!updatedUser) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Erro ao remover privilégios de admin',
      data: { userId },
    };
  }

  return {
    success: true,
    message: `Privilégios de admin removidos de ${updatedUser.username} com sucesso`,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.role === 'ADMIN',
    },
  };
}
