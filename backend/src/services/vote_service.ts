import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import * as sessionStore from '../stores/session_store.js';
import * as storyStore from '../stores/story_store.js';
import * as characterStore from '../stores/character_store.js';
import * as eventStore from '../stores/event_store.js';
import { advanceToNextChapter } from './game_service.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import type { GameUpdate } from '../models/update_schemas.js';
import type {
  SubmitVote,
  GetVoteStatus,
  SubmitVoteResponse,
  VoteStatusResponse,
  VotingResult,
  VoteCount,
  ResolveTie,
  ResolveTieResponse,
  TieResolutionStrategy,
} from '../models/vote_schemas.js';

export async function submitVote(params: SubmitVote): Promise<SubmitVoteResponse> {
  const { token, sessionId, characterId, opcaoId } = params;

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

  if (session.status !== 'IN_PROGRESS') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não está em andamento',
      data: { sessionId, currentStatus: session.status },
    };
  }

  const character = characterStore.findById(characterId);
  if (!character || character.userId !== userId || character.sessionId !== sessionId) {
    throw {
      ...JSON_RPC_ERRORS.FORBIDDEN,
      message: 'Personagem inválido ou não pertence a você nesta sessão',
      data: { characterId, userId, sessionId },
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
      message: 'Capítulo atual não possui opções de escolha',
      data: { chapterId: session.currentChapter },
    };
  }

  const validOption = currentChapter.opcoes.find((opt) => opt.id === opcaoId);
  if (!validOption) {
    throw {
      ...JSON_RPC_ERRORS.INVALID_PARAMS,
      message: 'Opção de voto inválida',
      data: { opcaoId, validOptions: currentChapter.opcoes.map((opt) => opt.id) },
    };
  }

  if (session.votes && session.votes[characterId]) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Você já votou nesta rodada',
      data: { characterId, currentVote: session.votes[characterId] },
    };
  }

  const updatedVotes = { ...(session.votes || {}), [characterId]: opcaoId };
  const isFirstVote = Object.keys(session.votes || {}).length === 0;

  sessionStore.updateSession(sessionId, {
    votes: updatedVotes,
  });

  const voteReceivedUpdate: GameUpdate = {
    id: `update_${uuidv4()}`,
    type: 'VOTE_RECEIVED',
    timestamp: new Date().toISOString(),
    sessionId,
    data: {
      characterId,
      characterName: character.name,
      opcaoId,
      pendingVotes: getOnlineParticipantsCount(sessionId) - Object.keys(updatedVotes).length,
    },
  };
  eventStore.addUpdate(voteReceivedUpdate);

  if (isFirstVote && session.votingTimer) {
    await startVotingTimer(sessionId);
  }

  const allVoted = checkAllVoted(sessionId);

  let votingResult: VotingResult | undefined;
  let nextChapterId: string | undefined;

  if (allVoted) {
    const result = await finalizeVoting(sessionId);
    votingResult = result.votingResult;
    nextChapterId = result.nextChapterId;
  }

  return {
    success: true,
    voteRegistered: {
      characterId,
      opcaoId,
    },
    allVoted,
    votingResult,
    nextChapterId,
    message: allVoted
      ? 'Voto registrado e votação finalizada'
      : `Voto registrado. Aguardando ${getOnlineParticipantsCount(sessionId) - Object.keys(updatedVotes).length} voto(s)`,
  };
}

export async function getVotingStatus(params: GetVoteStatus): Promise<VoteStatusResponse> {
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

  const userCharacter = characterStore.findByUserIdAndSessionId(userId, sessionId);
  const hasVoted = session.votes && userCharacter ? !!session.votes[userCharacter.id] : false;
  const currentVote = hasVoted && userCharacter ? session.votes![userCharacter.id] : undefined;

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

  const totalParticipants = getOnlineParticipantsCount(sessionId);
  const totalVotes = session.votes ? Object.keys(session.votes).length : 0;
  const allVoted = totalVotes >= totalParticipants;

  const voteCounts = calculateVoteCounts(sessionId, currentChapter.opcoes);

  const pendingVoters = session.participants
    .filter((p) => {
      if (!p.isOnline) return false;
      const char = characterStore.findByUserIdAndSessionId(p.userId, sessionId);
      return char && (!session.votes || !session.votes[char.id]);
    })
    .map((p) => {
      const char = characterStore.findByUserIdAndSessionId(p.userId, sessionId);
      return char?.name || 'Desconhecido';
    });

  return {
    status: {
      totalParticipants,
      totalVotes,
      allVoted,
      voteCounts,
      pendingVoters,
    },
    hasVoted,
    currentVote,
  };
}

export function checkAllVoted(sessionId: string): boolean {
  const session = sessionStore.findById(sessionId);
  if (!session) return false;

  const onlineParticipants = getOnlineParticipantsCount(sessionId);
  const totalVotes = session.votes ? Object.keys(session.votes).length : 0;

  return totalVotes >= onlineParticipants;
}

function getOnlineParticipantsCount(sessionId: string): number {
  const session = sessionStore.findById(sessionId);
  if (!session) return 0;

  return session.participants.filter((p) => p.isOnline).length;
}

function calculateVoteCounts(
  sessionId: string,
  options: Array<{ id: string; texto: string }>,
): VoteCount[] {
  const session = sessionStore.findById(sessionId);
  if (!session || !session.votes) {
    return options.map((opt) => ({
      opcaoId: opt.id,
      opcaoTexto: opt.texto,
      count: 0,
      percentage: 0,
    }));
  }

  const voteCounts: Record<string, number> = {};
  Object.values(session.votes).forEach((opcaoId) => {
    voteCounts[opcaoId] = (voteCounts[opcaoId] || 0) + 1;
  });

  const totalVotes = Object.keys(session.votes).length;

  return options.map((opt) => ({
    opcaoId: opt.id,
    opcaoTexto: opt.texto,
    count: voteCounts[opt.id] || 0,
    percentage: totalVotes > 0 ? ((voteCounts[opt.id] || 0) / totalVotes) * 100 : 0,
  }));
}

function calculateWinner(sessionId: string): {
  winningOption: VoteCount | null;
  allVotes: VoteCount[];
  isTie: boolean;
} {
  const session = sessionStore.findById(sessionId);
  if (!session) {
    return { winningOption: null, allVotes: [], isTie: false };
  }

  const story = storyStore.findById(session.storyId);
  if (!story) {
    return { winningOption: null, allVotes: [], isTie: false };
  }

  const currentChapter = story.capitulos[session.currentChapter];
  if (!currentChapter || !currentChapter.opcoes) {
    return { winningOption: null, allVotes: [], isTie: false };
  }

  const voteCounts = calculateVoteCounts(sessionId, currentChapter.opcoes);
  const allVotes = voteCounts.sort((a, b) => b.count - a.count);

  if (allVotes.length === 0 || allVotes[0].count === 0) {
    return { winningOption: null, allVotes, isTie: false };
  }

  const maxVotes = allVotes[0].count;
  const winners = allVotes.filter((v) => v.count === maxVotes);
  const isTie = winners.length > 1;

  return {
    winningOption: isTie ? null : allVotes[0],
    allVotes,
    isTie,
  };
}

export async function finalizeVoting(sessionId: string): Promise<{
  votingResult: VotingResult;
  nextChapterId: string;
}> {
  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const { winningOption, allVotes, isTie } = calculateWinner(sessionId);

  if (isTie || !winningOption) {
    const strategy = session.tieResolutionStrategy || 'RANDOM';
    return await handleTie(sessionId, strategy, allVotes);
  }

  const totalVotes = session.votes ? Object.keys(session.votes).length : 0;
  const isUnanimous = totalVotes > 0 && winningOption.count === totalVotes;

  const votingResult: VotingResult = {
    winningOption: {
      id: winningOption.opcaoId,
      texto: winningOption.opcaoTexto,
      voteCount: winningOption.count,
      percentage: winningOption.percentage,
    },
    allVotes,
    decisionMethod: isUnanimous ? 'UNANIMOUS' : 'MAJORITY',
    completedAt: new Date().toISOString(),
  };

  await advanceToNextChapter(
    sessionId,
    winningOption.opcaoId,
    winningOption.opcaoTexto,
    `${winningOption.opcaoTexto} (${winningOption.count}/${totalVotes} votos - ${winningOption.percentage.toFixed(0)}%)`,
  );

  const story = storyStore.findById(session.storyId);
  const currentChapter = story?.capitulos[session.currentChapter];
  const nextOption = currentChapter?.opcoes?.find((opt) => opt.id === winningOption.opcaoId);
  const nextChapterId = nextOption?.proximo || session.currentChapter;

  return {
    votingResult,
    nextChapterId,
  };
}

async function handleTie(
  sessionId: string,
  strategy: TieResolutionStrategy,
  allVotes: VoteCount[],
): Promise<{
  votingResult: VotingResult;
  nextChapterId: string;
}> {
  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const maxVotes = allVotes[0]?.count || 0;
  const tiedOptions = allVotes.filter((v) => v.count === maxVotes);

  let winningOption: VoteCount;

  if (strategy === 'RANDOM') {
    const randomIndex = Math.floor(Math.random() * tiedOptions.length);
    winningOption = tiedOptions[randomIndex];
  } else if (strategy === 'MASTER_DECIDES') {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Empate detectado. Mestre deve escolher a opção vencedora',
      data: { tiedOptions: tiedOptions.map((opt) => ({ id: opt.opcaoId, texto: opt.opcaoTexto })) },
    };
  } else if (strategy === 'REVOTE') {
    sessionStore.updateSession(sessionId, {
      votes: {},
    });

    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Empate detectado. Votos limpos para nova votação',
      data: { 
        tiedOptions: tiedOptions.map((opt) => ({ id: opt.opcaoId, texto: opt.opcaoTexto })),
        action: 'REVOTE_STARTED'
      },
    };
  } else {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Estratégia de resolução de empate inválida',
      data: { strategy, tiedOptions },
    };
  }

  const votingResult: VotingResult = {
    winningOption: {
      id: winningOption.opcaoId,
      texto: winningOption.opcaoTexto,
      voteCount: winningOption.count,
      percentage: winningOption.percentage,
    },
    allVotes,
    decisionMethod: 'TIE_RESOLVED',
    tieResolution: strategy,
    completedAt: new Date().toISOString(),
  };

  await advanceToNextChapter(
    sessionId,
    winningOption.opcaoId,
    winningOption.opcaoTexto,
    `Empate resolvido: ${winningOption.opcaoTexto} (${strategy})`,
  );

  const story = storyStore.findById(session.storyId);
  const currentChapter = story?.capitulos[session.currentChapter];
  const nextOption = currentChapter?.opcoes?.find((opt) => opt.id === winningOption.opcaoId);
  const nextChapterId = nextOption?.proximo || session.currentChapter;

  return {
    votingResult,
    nextChapterId,
  };
}

export async function resolveTie(params: ResolveTie): Promise<ResolveTieResponse> {
  const { token, sessionId, resolution, masterChoice } = params;

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
      message: 'Apenas o mestre da sessão pode resolver empates',
      data: { sessionId, userId },
    };
  }

  if (resolution === 'MASTER_DECIDES' && !masterChoice) {
    throw {
      ...JSON_RPC_ERRORS.INVALID_PARAMS,
      message: 'masterChoice é obrigatório quando resolution é MASTER_DECIDES',
      data: { resolution },
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

  const voteCounts = calculateVoteCounts(sessionId, currentChapter.opcoes);

  let winningOption: VoteCount;

  if (resolution === 'MASTER_DECIDES') {
    const chosen = voteCounts.find((v) => v.opcaoId === masterChoice);
    if (!chosen) {
      throw {
        ...JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Opção escolhida pelo mestre não encontrada',
        data: { masterChoice },
      };
    }
    winningOption = chosen;
  } else if (resolution === 'RANDOM') {
    const maxVotes = Math.max(...voteCounts.map((v) => v.count));
    const tiedOptions = voteCounts.filter((v) => v.count === maxVotes);
    const randomIndex = Math.floor(Math.random() * tiedOptions.length);
    winningOption = tiedOptions[randomIndex];
  } else if (resolution === 'REVOTE') {
    sessionStore.updateSession(sessionId, {
      votes: {},
    });

    return {
      success: true,
      resolution: 'REVOTE',
      votingResult: {
        winningOption: {
          id: '',
          texto: 'Nova votação iniciada',
          voteCount: 0,
          percentage: 0,
        },
        allVotes: voteCounts,
        decisionMethod: 'TIE_RESOLVED',
        tieResolution: 'REVOTE',
        completedAt: new Date().toISOString(),
      },
      nextChapterId: session.currentChapter,
      message: 'Votos limpos. Todos os jogadores devem votar novamente.',
    };
  } else {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Estratégia de resolução de empate inválida',
      data: { resolution },
    };
  }

  const votingResult: VotingResult = {
    winningOption: {
      id: winningOption.opcaoId,
      texto: winningOption.opcaoTexto,
      voteCount: winningOption.count,
      percentage: winningOption.percentage,
    },
    allVotes: voteCounts,
    decisionMethod: 'TIE_RESOLVED',
    tieResolution: resolution,
    completedAt: new Date().toISOString(),
  };

  await advanceToNextChapter(
    sessionId,
    winningOption.opcaoId,
    winningOption.opcaoTexto,
    `Empate resolvido pelo mestre: ${winningOption.opcaoTexto} (${resolution})`,
  );

  const nextOption = currentChapter.opcoes.find((opt) => opt.id === winningOption.opcaoId);
  const nextChapterId = nextOption?.proximo || session.currentChapter;

  return {
    success: true,
    resolution,
    votingResult,
    nextChapterId,
    message: `Empate resolvido com sucesso usando estratégia ${resolution}`,
  };
}

export async function configureVoteTimeout(
  params: import('../models/vote_schemas.js').ConfigureVoteTimeout,
): Promise<import('../models/vote_schemas.js').ConfigureVoteTimeoutResponse> {
  const { token, sessionId, durationSeconds } = params;

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
      message: 'Apenas o mestre da sessão pode configurar o timer',
      data: { sessionId, userId },
    };
  }

  sessionStore.updateSession(sessionId, {
    votingTimer: {
      durationSeconds,
      startedAt: undefined,
      expiresAt: undefined,
      isActive: false,
      extensionsUsed: 0,
    },
  });

  return {
    success: true,
    timer: {
      isActive: false,
      durationSeconds,
      remainingSeconds: durationSeconds,
      extensionsUsed: 0,
      hasExpired: false,
    },
    message: 'Timer de votação configurado com sucesso',
  };
}

export async function getVoteTimer(
  params: import('../models/vote_schemas.js').GetVoteTimer,
): Promise<import('../models/vote_schemas.js').GetVoteTimerResponse> {
  const { token, sessionId } = params;

  verifyToken(token);

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const timer = session.votingTimer;

  if (!timer) {
    return {
      timer: {
        isActive: false,
        durationSeconds: 30,
        remainingSeconds: 0,
        extensionsUsed: 0,
        hasExpired: false,
      },
    };
  }

  const now = new Date();
  let remainingSeconds = 0;
  let hasExpired = false;

  if (timer.isActive && timer.expiresAt) {
    const expiresAt = new Date(timer.expiresAt);
    remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    hasExpired = remainingSeconds === 0;

    if (hasExpired && timer.isActive) {
      await finalizeVotingOnTimeout(sessionId);
    }
  }

  return {
    timer: {
      isActive: timer.isActive,
      startedAt: timer.startedAt,
      expiresAt: timer.expiresAt,
      remainingSeconds,
      durationSeconds: timer.durationSeconds,
      extensionsUsed: timer.extensionsUsed,
      hasExpired,
    },
  };
}

export async function extendVoteTimer(
  params: import('../models/vote_schemas.js').ExtendVoteTimer,
): Promise<import('../models/vote_schemas.js').ExtendVoteTimerResponse> {
  const { token, sessionId, additionalSeconds } = params;

  verifyToken(token);

  const session = sessionStore.findById(sessionId);
  if (!session) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Sessão não encontrada',
      data: { sessionId },
    };
  }

  const timer = session.votingTimer;

  if (!timer || !timer.isActive) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Timer de votação não está ativo',
      data: { sessionId },
    };
  }

  if (!timer.expiresAt) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: 'Timer não possui data de expiração',
      data: { sessionId },
    };
  }

  const currentExpires = new Date(timer.expiresAt);
  const newExpires = new Date(currentExpires.getTime() + additionalSeconds * 1000);

  sessionStore.updateSession(sessionId, {
    votingTimer: {
      ...timer,
      expiresAt: newExpires.toISOString(),
      extensionsUsed: timer.extensionsUsed + 1,
    },
  });

  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((newExpires.getTime() - now.getTime()) / 1000));

  return {
    success: true,
    timer: {
      isActive: true,
      startedAt: timer.startedAt,
      expiresAt: newExpires.toISOString(),
      remainingSeconds,
      durationSeconds: timer.durationSeconds,
      extensionsUsed: timer.extensionsUsed + 1,
      hasExpired: false,
    },
    message: `Timer estendido em ${additionalSeconds} segundos`,
  };
}

export async function startVotingTimer(sessionId: string): Promise<void> {
  const session = sessionStore.findById(sessionId);
  if (!session || !session.votingTimer) {
    return;
  }

  const timer = session.votingTimer;

  if (timer.isActive) {
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + timer.durationSeconds * 1000);

  sessionStore.updateSession(sessionId, {
    votingTimer: {
      ...timer,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    },
  });

  scheduleTimerExpiration(sessionId, expiresAt);
}

function scheduleTimerExpiration(sessionId: string, expiresAt: Date): void {
  const now = new Date();
  const delay = Math.max(0, expiresAt.getTime() - now.getTime());

  setTimeout(async () => {
    await finalizeVotingOnTimeout(sessionId);
  }, delay);
}

async function finalizeVotingOnTimeout(sessionId: string): Promise<void> {
  const session = sessionStore.findById(sessionId);
  if (!session || !session.votingTimer || !session.votingTimer.isActive) {
    return;
  }

  console.log(`[TIMER] Finalizando votação por timeout na sessão ${sessionId}`);

  try {
    const result = await finalizeVoting(sessionId);

    sessionStore.updateSession(sessionId, {
      votingTimer: {
        ...session.votingTimer,
        isActive: false,
      },
    });

    console.log(
      `[TIMER] Votação finalizada com sucesso. Próximo capítulo: ${result.nextChapterId}`,
    );
  } catch (error) {
    console.error(`[TIMER] Erro ao finalizar votação por timeout:`, error);
  }
}
