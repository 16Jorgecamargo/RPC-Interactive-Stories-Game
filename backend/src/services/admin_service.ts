import * as userStore from '../stores/user_store.js';
import * as sessionStore from '../stores/session_store.js';
import * as characterStore from '../stores/character_store.js';
import * as storyStore from '../stores/story_store.js';
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
  GetAllSessions,
  GetAllSessionsResponse,
  GetSessionDetail,
  GetSessionDetailResponse,
  DeleteSession,
  DeleteSessionResponse,
  ForceSessionState,
  ForceSessionStateResponse,
  GetSystemStats,
  GetSystemStatsResponse,
  GetStoryUsage,
  GetStoryUsageResponse,
  ChapterChoiceStats,
} from '../models/admin_schemas.js';

const serverStartTime = Date.now();

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

export async function getAllSessions(params: GetAllSessions): Promise<GetAllSessionsResponse> {
  const { token, status, ownerId, storyId } = params;

  verifyAdmin(token);

  let sessions = sessionStore.findAll();

  if (status) {
    sessions = sessions.filter((s) => s.status === status);
  }

  if (ownerId) {
    sessions = sessions.filter((s) => s.ownerId === ownerId);
  }

  if (storyId) {
    sessions = sessions.filter((s) => s.storyId === storyId);
  }

  const allUsers = userStore.getAllUsers();
  const allStories = storyStore.findAll();

  const sessionsWithDetails = sessions.map((session) => {
    const owner = allUsers.find((u) => u.id === session.ownerId);
    const story = allStories.find((s) => s.id === session.storyId);

    return {
      id: session.id,
      name: session.name,
      storyId: session.storyId,
      storyName: story?.title || 'Desconhecida',
      ownerId: session.ownerId,
      ownerUsername: owner?.username || 'Desconhecido',
      status: session.status,
      currentChapter: session.currentChapter,
      participantIds: session.participants.map((p) => p.userId),
      participantCount: session.participants.length,
      maxPlayers: session.maxPlayers,
      createdAt: session.createdAt,
      isLocked: session.isLocked,
    };
  });

  return {
    sessions: sessionsWithDetails,
    total: sessionsWithDetails.length,
  };
}

export async function getSessionDetail(params: GetSessionDetail): Promise<GetSessionDetailResponse> {
  const { token, sessionId } = params;

  verifyAdmin(token);

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const owner = userStore.findById(session.ownerId);
  const story = storyStore.findById(session.storyId);

  return {
    id: session.id,
    name: session.name,
    storyId: session.storyId,
    storyName: story?.title || 'Desconhecida',
    ownerId: session.ownerId,
    ownerUsername: owner?.username || 'Desconhecido',
    status: session.status,
    currentChapter: session.currentChapter,
    participantIds: session.participants.map((p) => p.userId),
    participantCount: session.participants.length,
    maxPlayers: session.maxPlayers,
    createdAt: session.createdAt,
    isLocked: session.isLocked,
    votes: session.votes || {},
  };
}

export async function deleteSession(params: DeleteSession): Promise<DeleteSessionResponse> {
  const { token, sessionId } = params;

  verifyAdmin(token);

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const sessionCharacters = characterStore.findAll().filter((c) => c.sessionId === sessionId);

  for (const character of sessionCharacters) {
    characterStore.deleteCharacter(character.id);
  }

  sessionStore.deleteSession(sessionId);

  return {
    success: true,
    message: `Sessão ${session.name} excluída com sucesso`,
    charactersDeleted: sessionCharacters.length,
  };
}

export async function forceSessionState(params: ForceSessionState): Promise<ForceSessionStateResponse> {
  const { token, sessionId, newStatus } = params;

  verifyAdmin(token);

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const updatedSession = sessionStore.updateSession(sessionId, { status: newStatus });
  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Erro ao atualizar estado da sessão',
      data: { sessionId },
    };
  }

  return {
    success: true,
    message: `Estado da sessão alterado de ${session.status} para ${newStatus}`,
    session: {
      id: updatedSession.id,
      name: updatedSession.name,
      status: updatedSession.status,
    },
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export async function getSystemStats(params: GetSystemStats): Promise<GetSystemStatsResponse> {
  const { token } = params;

  verifyAdmin(token);

  const allUsers = userStore.getAllUsers();
  const allSessions = sessionStore.findAll();
  const allCharacters = characterStore.findAll();
  const allStories = storyStore.findAll();

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const onlineUsers = allSessions.filter((session) => {
    return session.participants.some((p) => {
      const lastActivity = p.lastActivity ? new Date(p.lastActivity) : new Date(p.joinedAt);
      return lastActivity >= fiveMinutesAgo;
    });
  }).length;

  const activeSessions = allSessions.filter(
    (s) => s.status !== 'COMPLETED'
  );

  const inProgressSessions = allSessions.filter(
    (s) => s.status === 'IN_PROGRESS'
  );

  const completedSessions = allSessions.filter(
    (s) => s.status === 'COMPLETED'
  );

  const completeCharacters = allCharacters.filter((c) => c.isComplete);

  const totalPlayers = allSessions.reduce((sum, s) => sum + s.participants.length, 0);
  const avgPlayersPerSession = allSessions.length > 0 ? totalPlayers / allSessions.length : 0;

  const storyPlayCounts = new Map<string, number>();
  allSessions.forEach((session) => {
    const count = storyPlayCounts.get(session.storyId) || 0;
    storyPlayCounts.set(session.storyId, count + 1);
  });

  let mostPlayedStory;
  if (storyPlayCounts.size > 0) {
    let maxCount = 0;
    let maxStoryId = '';
    storyPlayCounts.forEach((count, storyId) => {
      if (count > maxCount) {
        maxCount = count;
        maxStoryId = storyId;
      }
    });
    const story = allStories.find((s) => s.id === maxStoryId);
    if (story) {
      mostPlayedStory = {
        id: story.id,
        title: story.title,
        playCount: maxCount,
      };
    }
  }

  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

  return {
    stats: {
      users: {
        total: allUsers.length,
        admins: allUsers.filter((u) => u.role === 'ADMIN').length,
        online: onlineUsers,
      },
      sessions: {
        total: allSessions.length,
        active: activeSessions.length,
        inProgress: inProgressSessions.length,
        completed: completedSessions.length,
        avgPlayersPerSession: Math.round(avgPlayersPerSession * 100) / 100,
      },
      characters: {
        total: allCharacters.length,
        complete: completeCharacters.length,
      },
      stories: {
        total: allStories.length,
        mostPlayed: mostPlayedStory,
      },
      system: {
        uptime: uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getStoryUsage(params: GetStoryUsage): Promise<GetStoryUsageResponse> {
  const { token, storyId } = params;

  verifyAdmin(token);

  const story = storyStore.findById(storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId },
    };
  }

  const storySessions = sessionStore.findAll().filter((s) => s.storyId === storyId);

  const completedSessions = storySessions.filter((s) => s.status === 'COMPLETED');
  const inProgressSessions = storySessions.filter((s) => s.status === 'IN_PROGRESS');

  const uniquePlayers = new Set<string>();
  storySessions.forEach((session) => {
    session.participants.forEach((p) => uniquePlayers.add(p.userId));
  });

  const totalPlayers = storySessions.reduce((sum, s) => sum + s.participants.length, 0);
  const avgPlayersPerSession = storySessions.length > 0 ? totalPlayers / storySessions.length : 0;

  const chapterVotes = new Map<string, Map<string, number>>();

  storySessions.forEach((session) => {
    if (session.votes) {
      Object.values(session.votes).forEach((optionId) => {
        const chapterId = session.currentChapter;
        if (!chapterVotes.has(chapterId)) {
          chapterVotes.set(chapterId, new Map());
        }
        const chapterMap = chapterVotes.get(chapterId)!;
        chapterMap.set(optionId, (chapterMap.get(optionId) || 0) + 1);
      });
    }
  });

  const popularChoices: ChapterChoiceStats[] = [];

  chapterVotes.forEach((optionCounts, chapterId) => {
    const chapter = story.capitulos[chapterId];
    if (chapter) {
      const totalVotes = Array.from(optionCounts.values()).reduce((sum, count) => sum + count, 0);
      
      const choices = Array.from(optionCounts.entries()).map(([optionId, count]) => {
        const option = chapter.opcoes?.find((o: { id: string; texto: string; proximo: string }) => o.id === optionId);
        return {
          optionId,
          optionText: option?.texto || 'Desconhecida',
          voteCount: count,
          percentage: Math.round((count / totalVotes) * 10000) / 100,
        };
      }).sort((a, b) => b.voteCount - a.voteCount);

      popularChoices.push({
        chapterId,
        chapterText: chapter.texto.substring(0, 100) + (chapter.texto.length > 100 ? '...' : ''),
        choices,
        totalVotes,
      });
    }
  });

  return {
    story: {
      id: story.id,
      title: story.title,
    },
    usage: {
      totalSessions: storySessions.length,
      completedSessions: completedSessions.length,
      inProgressSessions: inProgressSessions.length,
      totalPlayers: uniquePlayers.size,
      avgPlayersPerSession: Math.round(avgPlayersPerSession * 100) / 100,
    },
    popularChoices: popularChoices.sort((a, b) => b.totalVotes - a.totalVotes),
  };
}
