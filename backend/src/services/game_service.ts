import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import * as sessionStore from '../stores/session_store.js';
import * as storyStore from '../stores/story_store.js';
import * as characterStore from '../stores/character_store.js';
import * as eventStore from '../stores/event_store.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import type { GameUpdate } from '../models/update_schemas.js';
import type {
  GetGameState,
  GetTimeline,
  GameStateResponse,
  TimelineResponse,
  GameState,
  ParticipantInfo,
  VoteInfo,
  TimelineEntry,
  RevertChapter,
  RevertChapterResponse,
} from '../models/game_schemas.js';
import type { Session } from '../models/session_schemas.js';
import type { Story, Chapter } from '../models/story_schemas.js';

export async function getGameState(params: GetGameState): Promise<GameStateResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { sessionId, userId },
    };
  }

  if (session.status !== 'IN_PROGRESS') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não está em andamento',
      data: { sessionId, currentStatus: session.status },
    };
  }

  const story = storyStore.findById(session.storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId: session.storyId },
    };
  }

  const currentChapter = story.capitulos[session.currentChapter];
  if (!currentChapter) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Capítulo atual não encontrado na história',
      data: { chapterId: session.currentChapter },
    };
  }

  const participantsInfo: ParticipantInfo[] = session.participants.map((p) => {
    const character = characterStore.findByUserIdAndSessionId(p.userId, sessionId);

    const hasVoted = session.votes ? Object.keys(session.votes).includes(character?.id || '') : false;

    return {
      userId: p.userId,
      characterId: character?.id,
      characterName: character?.name,
      race: character?.race,
      class: character?.class,
      hasVoted,
      isOnline: p.isOnline,
    };
  });

  const votesInfo: VoteInfo[] = session.votes
    ? Object.entries(session.votes).map(([characterId, opcaoId]) => ({
        characterId,
        opcaoId: opcaoId as string,
        timestamp: new Date().toISOString(),
      }))
    : [];

  const isFinalChapter = !currentChapter.opcoes || currentChapter.opcoes.length === 0;

  if (isFinalChapter && session.status === 'IN_PROGRESS') {
    await completeSession(sessionId);
  }

  const gameState: GameState = {
    sessionId: session.id,
    sessionName: session.name,
    sessionStatus: isFinalChapter ? 'COMPLETED' : session.status,
    currentChapter: {
      id: session.currentChapter,
      texto: currentChapter.texto,
      opcoes: currentChapter.opcoes,
      isCombat: currentChapter.isCombat,
    },
    participants: participantsInfo,
    votos: votesInfo,
    isFinalChapter,
  };

  return {
    gameState: {
      ...gameState,
      votes: session.votes || {},
    },
    message: isFinalChapter ? 'Capítulo final alcançado. História completa!' : 'Estado do jogo obtido com sucesso',
  };
}

export async function advanceToNextChapter(
  sessionId: string,
  winningOptionId: string,
  winningOptionText: string,
  votingResult: string,
): Promise<void> {
  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const story = storyStore.findById(session.storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId: session.storyId },
    };
  }

  const currentChapter = story.capitulos[session.currentChapter];
  if (!currentChapter || !currentChapter.opcoes) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Capítulo atual não possui opções',
      data: { chapterId: session.currentChapter },
    };
  }

  const selectedOption = currentChapter.opcoes.find((opt) => opt.id === winningOptionId);
  if (!selectedOption) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Opção selecionada não encontrada',
      data: { opcaoId: winningOptionId },
    };
  }

  const nextChapterId = selectedOption.proximo;
  const nextChapter = story.capitulos[nextChapterId];
  if (!nextChapter) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Próximo capítulo não encontrado',
      data: { nextChapterId },
    };
  }

  const timelineEntry: TimelineEntry = {
    id: `event_${uuidv4()}`,
    sessionId,
    chapterId: nextChapterId,
    chapterText: nextChapter.texto,
    choiceMade: winningOptionText,
    votingResult,
    timestamp: new Date().toISOString(),
    type: 'CHOICE_RESULT',
  };

  eventStore.addEvent(timelineEntry);

  sessionStore.updateSession(sessionId, {
    currentChapter: nextChapterId,
    votes: {},
  });

  const chapterChangedUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'CHAPTER_CHANGED',
    timestamp: new Date().toISOString(),
    sessionId,
    data: {
      newChapter: {
        id: nextChapterId,
        texto: nextChapter.texto,
        opcoes: nextChapter.opcoes || [],
      },
    },
  };
  eventStore.addUpdate(chapterChangedUpdate);
}

export async function completeSession(sessionId: string): Promise<void> {
  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const timelineEntry: TimelineEntry = {
    id: `event_${uuidv4()}`,
    sessionId,
    chapterId: session.currentChapter,
    chapterText: 'História concluída!',
    timestamp: new Date().toISOString(),
    type: 'SYSTEM_MESSAGE',
  };

  eventStore.addEvent(timelineEntry);

  const now = new Date().toISOString();
  sessionStore.updateSession(sessionId, {
    status: 'COMPLETED',
  });

  const storyEndedUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'STORY_ENDED',
    timestamp: now,
    sessionId,
    data: {
      completedAt: now,
    },
  };
  eventStore.addUpdate(storyEndedUpdate);
}

export function isFinalChapter(storyId: string, chapterId: string): boolean {
  const story = storyStore.findById(storyId);
  if (!story) {
    return false;
  }

  const chapter = story.capitulos[chapterId];
  if (!chapter) {
    return false;
  }

  return !chapter.opcoes || chapter.opcoes.length === 0;
}

export async function getTimelineHistory(params: GetTimeline): Promise<TimelineResponse> {
  const { token, sessionId, limit = 50 } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Você não é participante desta sessão',
      data: { sessionId, userId },
    };
  }

  const timeline = eventStore.findBySessionId(sessionId, limit);

  return {
    timeline,
    total: timeline.length,
  };
}

export async function revertToPreviousChapter(params: RevertChapter): Promise<RevertChapterResponse> {
  const { token, sessionId } = params;

  const decoded = verifyToken(token);
  const userId = decoded.userId;

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  if (session.ownerId !== userId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Apenas o mestre da sessão pode usar esse comando',
      data: { sessionId, userId },
    };
  }

  const story = storyStore.findById(session.storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId: session.storyId },
    };
  }

  let timeline = eventStore.findBySessionId(sessionId);
  if (!timeline || timeline.length <= 1) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não há capítulos anteriores para retornar',
      data: { sessionId },
    };
  }

  // Remove mensagens do sistema no final da timeline (ex: conclusão da história)
  while (timeline.length > 0) {
    const lastEntry = timeline[timeline.length - 1];
    if (lastEntry.type === 'SYSTEM_MESSAGE') {
      const removedSystem = eventStore.popLastSessionEvent(sessionId);
      if (!removedSystem) {
        break;
      }
      timeline = eventStore.findBySessionId(sessionId);
      continue;
    }
    break;
  }

  if (timeline.length <= 1) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não há capítulos anteriores para retornar',
      data: { sessionId },
    };
  }

  const lastEntry = timeline[timeline.length - 1];
  if (lastEntry.type !== 'CHOICE_RESULT') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não é possível reverter a partir deste estado',
      data: { sessionId, lastEntry },
    };
  }

  const previousEntry = timeline[timeline.length - 2];
  if (!previousEntry) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Capítulo anterior não encontrado',
      data: { sessionId },
    };
  }

  const removedEntry = eventStore.popLastSessionEvent(sessionId);
  if (!removedEntry) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Falha ao remover capítulo atual da timeline',
      data: { sessionId },
    };
  }

  const updatedTimeline = eventStore.findBySessionId(sessionId);
  if (!updatedTimeline.length) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Timeline ficou vazia após a reversão',
      data: { sessionId },
    };
  }

  const currentEntry = updatedTimeline[updatedTimeline.length - 1];
  const newChapterId = currentEntry.chapterId;
  const newChapter = story.capitulos[newChapterId];

  if (!newChapter) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Capítulo alvo da reversão não encontrado na história',
      data: { sessionId, chapterId: newChapterId },
    };
  }

  const wasCompleted = session.status === 'COMPLETED';
  const now = new Date().toISOString();

  const votingTimerUpdate = session.votingTimer
    ? {
        ...session.votingTimer,
        isActive: false,
        startedAt: undefined,
        expiresAt: undefined,
      }
    : undefined;

  const updatedSession = sessionStore.updateSession(session.id, {
    currentChapter: newChapterId,
    votes: {},
    status: 'IN_PROGRESS',
    votingTimer: votingTimerUpdate,
  });

  if (!updatedSession) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Não foi possível atualizar a sessão após a reversão',
      data: { sessionId },
    };
  }

  const chapterChangedUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'CHAPTER_CHANGED',
    timestamp: now,
    sessionId,
    data: {
      newChapter: {
        id: newChapterId,
        texto: newChapter.texto,
        opcoes: newChapter.opcoes || [],
      },
      meta: {
        reverted: true,
        revertedFrom: removedEntry.chapterId || null,
        revertedTo: previousEntry.chapterId || null,
      },
    },
  };

  eventStore.addUpdate(chapterChangedUpdate);

  if (wasCompleted) {
    const sessionStateUpdate: GameUpdate = {
      id: `update_${uuidv4()}`,
      type: 'SESSION_STATE_CHANGED',
      timestamp: now,
      sessionId,
      data: {
        oldState: 'COMPLETED',
        newState: 'IN_PROGRESS',
      },
    };

    eventStore.addUpdate(sessionStateUpdate);
  }

  return {
    success: true,
    chapter: {
      id: newChapterId,
      texto: newChapter.texto,
      opcoes: newChapter.opcoes || [],
    },
    message: 'Capítulo revertido com sucesso',
  };
}

export async function createInitialTimelineEntry(sessionId: string, storyId: string): Promise<void> {
  const story = storyStore.findById(storyId);
  if (!story) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'História não encontrada',
      data: { storyId },
    };
  }

  const initialChapter = story.capitulos[story.initialChapter];
  if (!initialChapter) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Capítulo inicial não encontrado',
      data: { chapterId: story.initialChapter },
    };
  }

  const timelineEntry: TimelineEntry = {
    id: `event_${uuidv4()}`,
    sessionId,
    chapterId: story.initialChapter,
    chapterText: initialChapter.texto,
    timestamp: new Date().toISOString(),
    type: 'STORY',
  };

  eventStore.addEvent(timelineEntry);
}
