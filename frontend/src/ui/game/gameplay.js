import { getToken, requireAuth } from '../../utils/auth.js';
import { getGameState, vote, checkGameUpdates, getTimelineHistory, revertChapter } from '../../services/gameService.js';
import {
  initiateCombat,
  getCombatState as fetchCombatState,
  rollInitiative as requestInitiative,
  performAttack as executeCombatAttack,
  skipTurn as requestSkipTurn,
} from '../../services/combatService.js';
import { getSessionDetails } from '../../services/sessionService.js';
import { sendRoomMessage, getRoomMessages } from '../../services/chatService.js';
import { getCharacter } from '../../services/characterService.js';
import { handleError, showNotification, escapeHtml } from '../shared/utils.js';
import tabManager from '../../utils/tabManager.js';
import { showTabBlockedModal, hideTabBlockedModal } from '../shared/tabBlockedModal.js';
import { unifiedPolling } from '../../services/unifiedPollingService.js';
import { enterRoom, leaveRoom } from '../../services/roomService.js';

requireAuth();

let gameState = null;
let sessionData = null;
let currentUserId = null;
let currentCharacterId = null;
let loadedMessageIds = new Set();
let hasVoted = false;
let myVote = null;
const characterCache = new Map();
let votingProgressBarActive = false;
let votingProgressBarInterval = null;
const VOTING_RESULT_DISPLAY_DURATION = 5000;
let votingResultTimeout = null;
let votingResultCountdownInterval = null;
let lastVotingContext = { chapter: null, votes: {} };
let lastTieStrategy = null;
let votingResultOverlayCallback = null;
let combatState = null;
let currentCombatChapterId = null;
let combatInitiativeOverlayVisible = false;
let hasRolledInitiative = false;
const initiativeAnimationIntervals = new Map();
let initiativePollingInterval = null;
let initiativeCountdownInterval = null;
let combatLogEntries = [];
let combatViewInitialized = false;
let combatActionSelection = {
  attackId: null,
  attackName: null,
  targetId: null,
};
let monstersData = null;
let currentStoryId = null;
const initiativeResults = new Map();
const INITIATIVE_PRE_DELAY_MS = 3000;
const ENEMY_PRE_TURN_DELAY_MS = 5000;
const ENEMY_TARGET_SELECTION_DURATION_MS = 8000;
const ENEMY_ATTACK_SELECTION_DURATION_MS = 8000;
const ENEMY_ATTACK_ROLL_DURATION_MS = 8000;
const ENEMY_DAMAGE_ANIMATION_DURATION_MS = 5000;
let attackAnimationQueue = Promise.resolve();

function enqueueAttackAnimation(task) {
  attackAnimationQueue = attackAnimationQueue
    .then(() => task())
    .catch((error) => {
      console.error('[COMBAT] Erro na animação de ataque:', error);
    });
  return attackAnimationQueue;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCharacterCached(characterId) {
  if (!characterId) return null;

  let character = characterCache.get(characterId);
  if (!character) {
    const token = getToken();
    character = await getCharacter(characterId, token);
    if (character) {
      characterCache.set(characterId, character);
    }
  }
  return character;
}

async function loadMonsterData(storyId) {
  if (monstersData && currentStoryId === storyId) {
    return monstersData;
  }

  try {
    const response = await fetch(`${window.ENV.SERVER_URL}/stories/${storyId}/monsters.json`);
    if (!response.ok) {
      console.warn('[MONSTERS] Arquivo monsters.json não encontrado para história:', storyId);
      return null;
    }
    monstersData = await response.json();
    currentStoryId = storyId;
    console.log('[MONSTERS] Dados de monstros carregados:', monstersData);
    return monstersData;
  } catch (error) {
    console.error('[MONSTERS] Erro ao carregar monsters.json:', error);
    return null;
  }
}

function getMonsterById(monsterId) {
  if (!monstersData || !monstersData.monsters) {
    return null;
  }
  return monstersData.monsters.find(m => m.id === monsterId);
}

function resolveMonsterLookupId(enemy) {
  if (!enemy) return null;
  if (enemy.monsterId) return enemy.monsterId;
  let identifier = enemy.id || '';
  if (typeof identifier !== 'string') {
    return null;
  }
  identifier = identifier.replace(/^enemy_/, '');
  identifier = identifier.replace(/_\d+$/, '');
  return identifier || null;
}

const ATTRIBUTE_LABELS = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma',
};

document.addEventListener('DOMContentLoaded', async () => {
  tabManager.init(
    () => {
      console.log('[GAMEPLAY] Aba bloqueada - outra aba assumiu controle');
      showTabBlockedModal();
      unifiedPolling.stopAll();
    },
    () => {
      console.log('[GAMEPLAY] Aba desbloqueada - reassumindo controle');
      hideTabBlockedModal();
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      if (sessionId) {
        startGamePolling(sessionId);
      }
    }
  );

  if (!tabManager.isLeaderTab()) {
    console.log('[GAMEPLAY] Aba não é líder, aguardando...');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  if (!sessionId) {
    showNotification('ID da sessão não encontrado', 'error');
    setTimeout(() => window.location.href = '/home.html', 2000);
    return;
  }

  await loadGameData(sessionId);
  setupEventListeners();
  startGamePolling(sessionId);
});

async function loadGameData(sessionId) {
  try {
    console.log('[GAMEPLAY] Carregando dados do jogo, sessionId:', sessionId);
    const token = getToken();

    const RpcClient = (await import('../../rpc/client.js')).default;
    const client = new RpcClient();
    const meResponse = await client.call('me', { token });
    currentUserId = meResponse.user ? meResponse.user.id : meResponse.id;
    console.log('[GAMEPLAY] Usuário atual:', currentUserId);

    console.log('[GAMEPLAY] Buscando estado do jogo e detalhes da sessão...');
    const [gameStateResponse, sessionDetailsResponse] = await Promise.all([
      getGameState(sessionId, token),
      getSessionDetails(sessionId, token)
    ]);

    console.log('[GAMEPLAY] Resposta getGameState:', gameStateResponse);
    console.log('[GAMEPLAY] Resposta getSessionDetails:', sessionDetailsResponse);

    gameState = gameStateResponse.gameState;
    sessionData = sessionDetailsResponse.session;
    updateVotingContext();

    const currentParticipant = sessionData.participants.find(p => p.userId === currentUserId);
    currentCharacterId = currentParticipant ? currentParticipant.characterId : null;

    if (sessionData.storyId) {
      await loadMonsterData(sessionData.storyId);
    }

    renderSessionInfo();
    renderStoryAndOptions();
    renderCharacters();
    checkAllPlayersOnline();
    await loadChatMessages(sessionId);

    try {
      await enterRoom(sessionId, token);
      console.log('[GAMEPLAY] Presença marcada na sala de jogo');
    } catch (error) {
      console.error('[GAMEPLAY] Erro ao marcar presença:', error);
    }
  } catch (error) {
    handleError(error);
    setTimeout(() => window.location.href = '/home.html', 2000);
  }
}

function renderSessionInfo() {
  const storyTitleEl = document.getElementById('storyTitle');
  const sessionNameEl = document.getElementById('sessionName');

  if (gameState.story) {
    storyTitleEl.textContent = gameState.story.title || 'Aventura';
  }
  sessionNameEl.textContent = sessionData.name || 'Sessão';
}

function renderStoryAndOptions() {
  const storyTextEl = document.getElementById('storyText');
  const optionsContainerEl = document.getElementById('optionsContainer');
  const combatViewEl = document.getElementById('combatView');
  const storyTitleEl = document.querySelector('.story-card h2');

  if (storyTitleEl) {
    storyTitleEl.textContent = 'História';
  }

  if (combatViewEl) {
    combatViewEl.style.display = 'none';
  }

  if (gameState.currentChapter) {
    const chapter = gameState.currentChapter;
    storyTextEl.innerHTML = escapeHtml(chapter.texto).replace(/\n/g, '<br>');

    if (chapter.isCombat) {
      setupCombatChapter(chapter);
      return;
    }

    currentCombatChapterId = null;
    combatState = null;
    combatViewInitialized = false;
    hasRolledInitiative = false;
    initiativeResults.clear();
    clearInitiativeIntervals();
    const combatInitiativeOverlay = document.getElementById('combatInitiativeOverlay');
    if (combatInitiativeOverlay) {
      combatInitiativeOverlay.style.display = 'none';
    }

    if (chapter.opcoes && chapter.opcoes.length > 0) {
      renderOptions(chapter.opcoes);
    } else {
      optionsContainerEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 20px;">
          <h3>Fim do Capítulo</h3>
          <p>Aguarde o mestre avançar a história...</p>
        </div>
      `;
    }
  } else {
    storyTextEl.innerHTML = '<em>Carregando capítulo...</em>';
    optionsContainerEl.innerHTML = '';
  }
}

async function setupCombatChapter(chapter) {
  const optionsContainerEl = document.getElementById('optionsContainer');
  const votingStatusEl = document.getElementById('votingStatus');
  const combatViewEl = document.getElementById('combatView');
  const storyTitleEl = document.querySelector('.story-card h2');

  if (optionsContainerEl) {
    optionsContainerEl.style.display = 'none';
    optionsContainerEl.innerHTML = '';
  }

  if (votingStatusEl) {
    votingStatusEl.style.display = 'none';
  }

  if (storyTitleEl) {
    storyTitleEl.textContent = 'Combate';
  }

  if (combatViewEl) {
    combatViewEl.style.display = 'none';
  }

  try {
    await initializeCombatFlow(chapter);
  } catch (error) {
    console.error('[COMBAT] erro ao preparar combate:', error);
    showNotification(error?.message || 'Não foi possível iniciar o combate', 'error');
  }
}

function startVotingProgressBar(durationInSeconds = 60) {
  const progressBarEl = document.getElementById('votingProgressBar');
  const progressFillEl = progressBarEl?.querySelector('.voting-progress-fill');

  if (!progressBarEl || !progressFillEl) return;

  if (votingProgressBarActive) return;

  progressBarEl.style.display = 'block';
  progressFillEl.style.transition = `width ${durationInSeconds}s linear`;

  setTimeout(() => {
    progressFillEl.style.width = '100%';
  }, 100);

  votingProgressBarActive = true;

  votingProgressBarInterval = setTimeout(() => {
    votingProgressBarActive = false;
  }, durationInSeconds * 1000);
}

function stopVotingProgressBar() {
  const progressBarEl = document.getElementById('votingProgressBar');
  const progressFillEl = progressBarEl?.querySelector('.voting-progress-fill');

  if (votingProgressBarInterval) {
    clearTimeout(votingProgressBarInterval);
    votingProgressBarInterval = null;
  }

  if (progressBarEl) {
    progressBarEl.style.display = 'none';
  }

  if (progressFillEl) {
    progressFillEl.style.transition = 'none';
    progressFillEl.style.width = '0%';
  }

  votingProgressBarActive = false;
}

function shallowCloneChapter(chapter) {
  if (!chapter) return null;

  const cloned = { ...chapter };
  if (Array.isArray(chapter.opcoes)) {
    cloned.opcoes = chapter.opcoes.map(opcao => ({ ...opcao }));
  }
  return cloned;
}

function updateVotingContext() {
  if (sessionData?.tieResolutionStrategy) {
    lastTieStrategy = sessionData.tieResolutionStrategy;
  }

  if (!gameState?.currentChapter) {
    return;
  }

  const votes = gameState.votes || {};
  if (Object.keys(votes).length === 0) {
    return;
  }

  lastVotingContext = {
    chapter: shallowCloneChapter(gameState.currentChapter),
    votes: { ...votes },
  };
}

function clearVotingResultTimers() {
  if (votingResultTimeout) {
    clearTimeout(votingResultTimeout);
    votingResultTimeout = null;
  }

  if (votingResultCountdownInterval) {
    clearInterval(votingResultCountdownInterval);
    votingResultCountdownInterval = null;
  }
}

function hideVotingResultOverlay(invokeCallback = true) {
  const overlayEl = document.getElementById('votingResultOverlay');
  clearVotingResultTimers();

  if (overlayEl) {
    overlayEl.style.display = 'none';
  }

  const progressFillEl = document.getElementById('votingResultProgressFill');
  if (progressFillEl) {
    progressFillEl.style.transition = 'none';
    progressFillEl.style.width = '0%';
  }

  const countdownEl = document.getElementById('votingResultCountdown');
  if (countdownEl) {
    countdownEl.textContent = '';
  }

  const callback = votingResultOverlayCallback;
  votingResultOverlayCallback = null;

  if (invokeCallback && typeof callback === 'function') {
    callback();
  }
}

function showVotingResultOverlay(resultInfo, options = {}) {
  const {
    onThreshold,
    thresholdSeconds = 3,
    onComplete,
  } = options;
  const overlayEl = document.getElementById('votingResultOverlay');
  if (!overlayEl || !resultInfo) return;

  clearVotingResultTimers();
  votingResultOverlayCallback = typeof onComplete === 'function' ? onComplete : null;
  let thresholdTriggered = false;

  const choiceEl = document.getElementById('votingResultChoice');
  const methodEl = document.getElementById('votingResultMethod');
  const detailsEl = document.getElementById('votingResultDetails');
  const countdownEl = document.getElementById('votingResultCountdown');
  const progressFillEl = document.getElementById('votingResultProgressFill');

  if (choiceEl) {
    choiceEl.textContent = `Opção vencedora: ${resultInfo.choiceText || '—'}`;
  }

  if (methodEl) {
    methodEl.textContent = `Método: ${resultInfo.methodLabel || '—'}`;
  }

  if (detailsEl) {
    if (resultInfo.totalVotes > 0 && resultInfo.voteCount !== undefined && resultInfo.voteCount !== null) {
      const percentText = typeof resultInfo.percentage === 'number' ? ` (${resultInfo.percentage}%)` : '';
      detailsEl.textContent = `Votos: ${resultInfo.voteCount} de ${resultInfo.totalVotes}${percentText}`;
      detailsEl.style.display = 'block';
    } else {
      detailsEl.textContent = '';
      detailsEl.style.display = 'none';
    }
  }

  overlayEl.style.display = 'flex';

  if (progressFillEl) {
    progressFillEl.style.transition = 'none';
    progressFillEl.style.width = '0%';
    void progressFillEl.offsetWidth;
    progressFillEl.style.transition = `width ${VOTING_RESULT_DISPLAY_DURATION / 1000}s linear`;
    progressFillEl.style.width = '100%';
  }

  if (countdownEl) {
    let remainingSeconds = Math.ceil(VOTING_RESULT_DISPLAY_DURATION / 1000);
    countdownEl.textContent = `Continuando em ${remainingSeconds}s...`;

    if (votingResultCountdownInterval) {
      clearInterval(votingResultCountdownInterval);
    }

    votingResultCountdownInterval = setInterval(() => {
      remainingSeconds -= 1;
      if (!thresholdTriggered && remainingSeconds === thresholdSeconds) {
        thresholdTriggered = true;
        if (typeof onThreshold === 'function') {
          try {
            onThreshold();
          } catch (error) {
            console.error('[GAMEPLAY] Erro ao executar callback do overlay:', error);
          }
        }
      }
      if (remainingSeconds <= 0) {
        countdownEl.textContent = 'Continuando...';
        clearInterval(votingResultCountdownInterval);
        votingResultCountdownInterval = null;
      } else {
        countdownEl.textContent = `Continuando em ${remainingSeconds}s...`;
      }
    }, 1000);
  }

  votingResultTimeout = setTimeout(() => {
    hideVotingResultOverlay();
  }, VOTING_RESULT_DISPLAY_DURATION);
}

function computeVotingResultSummary(previousChapter, votesMap, nextChapterId) {
  const referenceChapter = (previousChapter && previousChapter.opcoes && previousChapter.opcoes.length > 0)
    ? previousChapter
    : lastVotingContext.chapter;

  if (!referenceChapter || !referenceChapter.opcoes || referenceChapter.opcoes.length === 0) {
    return null;
  }

  const votesSource = votesMap && Object.keys(votesMap).length > 0 ? votesMap : lastVotingContext.votes;
  const votes = votesSource || {};
  const voteValues = Object.values(votes);
  const totalVotes = voteValues.length;

  if (totalVotes === 0) {
    return null;
  }

  const voteCountMap = new Map();
  voteValues.forEach(voteId => {
    voteCountMap.set(voteId, (voteCountMap.get(voteId) || 0) + 1);
  });

  const winningOption =
    referenceChapter.opcoes.find(option => option.proximo === nextChapterId) ||
    referenceChapter.opcoes.find(option => option.id === nextChapterId);

  if (!winningOption) {
    return null;
  }

  const winningCount = voteCountMap.get(winningOption.id) || 0;
  const maxCount = Math.max(...Array.from(voteCountMap.values()), 0);
  const topOptions = referenceChapter.opcoes.filter(
    option => (voteCountMap.get(option.id) || 0) === maxCount
  );

  let methodKey = 'MAJORITY';
  let methodLabel = 'Quantidade de votos';

  if (topOptions.length > 1 && maxCount > 0) {
    const tieStrategy = sessionData?.tieResolutionStrategy || lastTieStrategy || 'RANDOM';
    switch (tieStrategy) {
      case 'MASTER_DECIDES':
        methodKey = 'MASTER_DECIDES';
        methodLabel = 'Decisão do mestre';
        break;
      case 'REVOTE':
        methodKey = 'REVOTE';
        methodLabel = 'Nova votação';
        break;
      default:
        methodKey = 'RANDOM';
        methodLabel = 'Aleatório';
        break;
    }
  } else if (winningCount === totalVotes) {
    methodKey = 'UNANIMOUS';
    methodLabel = 'Quantidade de votos (unânime)';
  }

  const percentage = totalVotes > 0 ? Math.round((winningCount / totalVotes) * 100) : null;

  return {
    choiceText: winningOption.texto,
    methodLabel,
    methodKey,
    voteCount: winningCount,
    totalVotes,
    percentage,
  };
}

function resetVotingContextForNextChapter(nextChapterData = null) {
  lastVotingContext = {
    chapter: nextChapterData ? shallowCloneChapter(nextChapterData) : null,
    votes: {},
  };
}

function parseTimelineVotingResult(entry) {
  if (!entry) return null;

  const choiceText = entry.choiceMade || entry.chapterText || '';
  const votingResultText = entry.votingResult || '';

  let voteCount;
  let totalVotes;
  let percentage;

  const votesMatch = votingResultText.match(/(\d+)\s*\/\s*(\d+)\s*votos?/i);
  if (votesMatch) {
    voteCount = Number.parseInt(votesMatch[1], 10);
    totalVotes = Number.parseInt(votesMatch[2], 10);
  }

  const percentageMatch = votingResultText.match(/(\d+)\s*%/);
  if (percentageMatch) {
    percentage = Number.parseInt(percentageMatch[1], 10);
  }

  let methodLabel = 'Quantidade de votos';

  if (/empate resolvido/i.test(votingResultText)) {
    if (/\(RANDOM\)/i.test(votingResultText)) {
      methodLabel = 'Aleatório';
    } else if (/\(MASTER_DECIDES\)/i.test(votingResultText)) {
      methodLabel = 'Decisão do mestre';
    } else if (/\(REVOTE\)/i.test(votingResultText)) {
      methodLabel = 'Nova votação';
    } else {
      methodLabel = 'Aleatório';
    }
  } else if (voteCount !== undefined && totalVotes !== undefined && totalVotes > 0 && voteCount === totalVotes) {
    methodLabel = 'Quantidade de votos (unânime)';
  }

  return {
    choiceText,
    methodLabel,
    voteCount,
    totalVotes,
    percentage,
  };
}

async function fetchVotingResultFromTimeline() {
  try {
    if (!sessionData?.id) {
      return null;
    }

    const token = getToken();
    const response = await getTimelineHistory(sessionData.id, token, 5);
    const entries = response.timeline || [];

    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i];
      if (entry?.type === 'CHOICE_RESULT') {
        const parsed = parseTimelineVotingResult(entry);
        if (parsed) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.error('[GAMEPLAY] Erro ao buscar timeline para resultado de votação:', error);
  }

  return null;
}

function checkAllPlayersOnline() {
  if (!sessionData || !sessionData.participants) return;

  const allOnline = sessionData.participants.every(p => p.isOnline);
  const offlineWarningEl = document.getElementById('offlineWarningOverlay');
  const offlinePlayersListEl = document.getElementById('offlinePlayersList');

  if (!allOnline) {
    const offlinePlayers = sessionData.participants.filter(p => !p.isOnline);

    if (offlinePlayersListEl) {
      offlinePlayersListEl.innerHTML = offlinePlayers
        .map(p => `<p>⏸ ${escapeHtml(p.username || 'Jogador')} está offline</p>`)
        .join('');
    }

    if (offlineWarningEl) {
      offlineWarningEl.style.display = 'flex';
    }
  } else {
    if (offlineWarningEl) {
      offlineWarningEl.style.display = 'none';
    }
  }
}

function renderOptions(opcoes) {
  const optionsContainerEl = document.getElementById('optionsContainer');
  const votingStatusEl = document.getElementById('votingStatus');

  const votes = gameState.votes || {};
  const myVoteId = votes[currentCharacterId];
  hasVoted = !!myVoteId;
  myVote = myVoteId;

  const voteCount = {};
  Object.values(votes).forEach(voteId => {
    voteCount[voteId] = (voteCount[voteId] || 0) + 1;
  });

  if (hasVoted) {
    optionsContainerEl.style.display = 'none';
    votingStatusEl.style.display = 'block';

    const myVotedOption = opcoes.find(op => op.id === myVoteId);
    renderVotingStatus(myVotedOption);
  } else {
    optionsContainerEl.style.display = 'flex';
    votingStatusEl.style.display = 'none';
    optionsContainerEl.innerHTML = '';

    opcoes.forEach(opcao => {
      const count = voteCount[opcao.id] || 0;

      const optionCard = document.createElement('div');
      optionCard.className = 'option-card';

      const voteCountHtml = count > 0
        ? `<span class="vote-count">${count} ${count === 1 ? 'voto' : 'votos'}</span>`
        : '';

      optionCard.innerHTML = `
        <h4>${escapeHtml(opcao.texto)}</h4>
        ${voteCountHtml}
      `;

      optionCard.addEventListener('click', () => handleVote(opcao.id));

      optionsContainerEl.appendChild(optionCard);
    });
  }

  const totalVotes = Object.keys(votes).length;
  if (totalVotes > 0 && !votingProgressBarActive) {
    const votingDuration = sessionData?.votingDuration || 60;
    startVotingProgressBar(votingDuration);
  }
}

async function handleVote(opcaoId) {
  if (hasVoted) {
    showNotification('Você já votou nesta rodada', 'warning');
    return;
  }

  if (!currentCharacterId) {
    showNotification('Você precisa ter um personagem para votar', 'error');
    return;
  }

  try {
    const token = getToken();

    await vote(sessionData.id, currentCharacterId, opcaoId, token);

    hasVoted = true;
   myVote = opcaoId;

    gameState.votes = gameState.votes || {};
    gameState.votes[currentCharacterId] = opcaoId;
    updateVotingContext();

    renderStoryAndOptions();

    showNotification('Voto registrado com sucesso!', 'success');

    await refreshGameState();
  } catch (error) {
    handleError(error);
  }
}

function renderVotingStatus(myVotedOption = null) {
  const votingStatusEl = document.getElementById('votingStatus');
  const votingInfoEl = document.getElementById('votingInfo');

  votingStatusEl.style.display = 'block';

  const votes = gameState.votes || {};
  const totalVotes = Object.keys(votes).length;
  const totalParticipants = sessionData.participants.filter(p => p.hasCreatedCharacter).length;
  const votesNeeded = totalParticipants - totalVotes;

  let votedOptionHtml = '';
  if (myVotedOption) {
    votedOptionHtml = `
      <div style="margin-bottom: 15px; padding: 12px; background: rgba(212, 175, 55, 0.15); border-radius: 8px; border: 1px solid var(--primary-gold);">
        <p style="color: var(--primary-gold); font-weight: 600; margin-bottom: 5px;">✓ Você votou em:</p>
        <p style="color: var(--parchment); font-size: 0.95rem;">${escapeHtml(myVotedOption.texto)}</p>
      </div>
    `;
  }

  votingInfoEl.innerHTML = `
    ${votedOptionHtml}
    <p>Votos: ${totalVotes} / ${totalParticipants}</p>
    ${votesNeeded > 0
      ? `<p>Aguardando ${votesNeeded} ${votesNeeded === 1 ? 'voto' : 'votos'}...</p>`
      : '<p style="color: var(--green); font-weight: 700;">Todos votaram! Processando resultado...</p>'
    }
  `;
}

function renderCharacters() {
  const charactersListEl = document.getElementById('charactersList');
  charactersListEl.innerHTML = '';

  sessionData.participants.forEach(participant => {
    if (!participant.hasCreatedCharacter) return;

    const isCurrentUser = participant.userId === currentUserId;

    const characterItem = document.createElement('div');
    characterItem.className = 'character-item';

    if (isCurrentUser) {
      characterItem.classList.add('current-user');
    }

    if (!participant.isOnline) {
      characterItem.classList.add('offline');
    }

    const username = participant.username || 'Jogador';
    const characterName = participant.characterName || 'Personagem';
    const displayName = isCurrentUser ? 'Você' : username;

    characterItem.innerHTML = `
      <div class="character-info">
        <h4>${escapeHtml(characterName)}</h4>
        <p>${escapeHtml(displayName)}</p>
      </div>
      <button class="btn btn-secondary" onclick="viewCharacter('${participant.characterId}')">
        Ver Ficha
      </button>
    `;

    charactersListEl.appendChild(characterItem);
  });
}

async function loadChatMessages(sessionId) {
  try {
    const token = getToken();
    const response = await getRoomMessages(sessionId, token);

    if (response.messages && response.messages.length > 0) {
      response.messages.forEach(message => {
        if (!loadedMessageIds.has(message.id)) {
          loadedMessageIds.add(message.id);
          appendChatMessage(message);
        }
      });
      console.log('[CHAT] Mensagens carregadas:', response.messages.length);
    }
  } catch (error) {
    console.error('[CHAT] Erro ao carregar mensagens:', error);
  }
}

function appendChatMessage(message) {
  const chatMessagesEl = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');

  const isCurrentUser = message.userId === currentUserId;
  const isSystem = message.type === 'SYSTEM' || message.type === 'system' || message.userId === 'system';
  const isCombatMessage = message.type === 'combat-player' || message.type === 'combat-enemy' || message.type === 'combat-system';

  let messageClass = 'chat-message';

  if (isCombatMessage) {
    messageClass += ` ${message.type}`;
  } else if (isSystem) {
    messageClass += ' system';
  } else if (isCurrentUser) {
    messageClass += ' current';
  } else {
    messageClass += ' user';
  }

  const timestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let senderName;
  let messageText;

  if (isCombatMessage) {
    senderName = message.type === 'combat-system' ? '⚔️ Combate' : '';
    messageText = message.content || message.message || '';
  } else {
    senderName = isSystem
      ? 'ℹ️ Sistema'
      : isCurrentUser
        ? 'Você'
        : message.characterName || message.username || 'Jogador';
    messageText = message.message || '';
  }

  if (message.type === 'combat-system') {
    messageDiv.className = messageClass;
    messageDiv.innerHTML = `
      <strong>${escapeHtml(senderName)}:</strong> ${escapeHtml(messageText)}
      <span class="timestamp">${timestamp}</span>
    `;
  } else {
    messageDiv.className = messageClass;
    messageDiv.innerHTML = `
      ${senderName ? `<strong>${escapeHtml(senderName)}:</strong> ` : ''}${escapeHtml(messageText)}
      <span class="timestamp">${timestamp}</span>
    `;
  }

  chatMessagesEl.appendChild(messageDiv);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function sendChatMessage() {
  const messageInputEl = document.getElementById('messageInput');
  const message = messageInputEl.value.trim();

  if (!message) return;

  if (message === '/back') {
    messageInputEl.value = '';

    if (sessionData?.ownerId !== currentUserId) {
      showNotification('Apenas o mestre pode usar esse comando.', 'warning');
      return;
    }

    try {
      const token = getToken();
      await revertChapter(sessionData.id, token);
      showNotification('História revertida um passo.', 'info');
    } catch (error) {
      handleError(error);
    }

    return;
  }

  try {
    const token = getToken();
    messageInputEl.value = '';

    await sendRoomMessage(sessionData.id, message, token);
  } catch (error) {
    showNotification('Erro ao enviar mensagem: ' + error.message, 'error');
    messageInputEl.value = message;
  }
}

window.handleEnter = function(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
};

function formatAbilityModifier(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return '—';
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function formatSignedNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value >= 0 ? `+${value}` : `${value}`;
}

function setListContent(element, items, emptyMessage = 'Nenhuma informação disponível') {
  if (!element) return;
  if (!items || !items.length) {
    element.innerHTML = `<li style="opacity: 0.7;">${emptyMessage}</li>`;
    return;
  }
  element.innerHTML = items.join('');
}

function setSectionVisibility(sectionElement, shouldShow, displayMode = 'block') {
  if (!sectionElement) return;
  sectionElement.style.display = shouldShow ? displayMode : 'none';
}

function formatMultilineText(value) {
  if (!value) return null;
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function showCharacterDialogLoading() {
  const overlay = document.getElementById('characterDialog');
  const nameEl = document.getElementById('charName');
  const raceClassEl = document.getElementById('charRaceClass');
  const attributesEl = document.getElementById('charAttributes');
  const combatEl = document.getElementById('charCombatStats');
  const backgroundEl = document.getElementById('charBackground');
  const equipmentEl = document.getElementById('charEquipment');
  const detailsEl = document.getElementById('charDetails');

  if (overlay) {
    overlay.style.display = 'flex';
  }
  if (nameEl) nameEl.textContent = 'Carregando ficha...';
  if (raceClassEl) raceClassEl.textContent = '';
  if (attributesEl) attributesEl.innerHTML = '<li>Carregando atributos...</li>';
  if (combatEl) combatEl.innerHTML = '<li>Carregando dados de combate...</li>';
  if (backgroundEl) backgroundEl.innerHTML = '<em>Carregando história...</em>';
  if (equipmentEl) equipmentEl.innerHTML = '<li>Carregando equipamentos...</li>';
  if (detailsEl) detailsEl.innerHTML = '';

  const metaSection = document.getElementById('charMetaSection');
  setSectionVisibility(metaSection, false);
  setSectionVisibility(document.getElementById('charProficienciesSection'), false);
  setSectionVisibility(document.getElementById('charAttacksSection'), false);
  setSectionVisibility(document.getElementById('charSpellsSection'), false);
  setSectionVisibility(document.getElementById('charFeatureSection'), false);
}

function renderProficiencies(proficiencies) {
  const section = document.getElementById('charProficienciesSection');
  const container = document.getElementById('charProficiencies');

  if (!section || !container) return;

  if (!proficiencies) {
    container.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  const categories = [
    { key: 'armor', label: 'Armaduras' },
    { key: 'weapons', label: 'Armas' },
    { key: 'tools', label: 'Ferramentas' },
    { key: 'skills', label: 'Perícias' },
    { key: 'other', label: 'Outros' },
  ];

  const blocks = categories
    .map(({ key, label }) => {
      const items = proficiencies[key];
      if (!items || !items.length) return '';

      const listItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return `
        <div>
          <h5 style="margin-bottom: 6px; color: var(--primary-gold); font-size: 0.9rem;">${label}</h5>
          <ul style="color: var(--parchment); font-size: 0.85rem; list-style: disc; padding-left: 18px;">
            ${listItems}
          </ul>
        </div>
      `;
    })
    .filter(Boolean);

  if (!blocks.length) {
    container.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  container.innerHTML = blocks.join('');
  section.style.display = 'block';
}

function renderAttacks(character) {
  const section = document.getElementById('charAttacksSection');
  const listEl = document.getElementById('charAttacks');
  if (!section || !listEl) return;

  const sheetAttacks = character.sheet?.attacks || [];
  const selectedAttacks = character.selectedAttacks || [];
  const attacks = sheetAttacks.length ? sheetAttacks : selectedAttacks;

  if (!attacks || !attacks.length) {
    listEl.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  const items = attacks.map((attack) => {
    const name = attack.name ? escapeHtml(attack.name) : 'Ataque';
    const parts = [];

    if (attack.attackBonus) parts.push(`Bônus ${escapeHtml(attack.attackBonus)}`);
    if (attack.damage) parts.push(`Dano ${escapeHtml(attack.damage)}`);
    if (attack.type) parts.push(`Tipo ${escapeHtml(attack.type)}`);
    if (typeof attack.cooldown === 'number' && attack.cooldown > 0) {
      parts.push(`Recarga ${attack.cooldown}`);
    }

    if (attack.notes) {
      const notes = formatMultilineText(attack.notes);
      if (notes) parts.push(notes);
    }
    if (attack.description) {
      const description = formatMultilineText(attack.description);
      if (description) parts.push(description);
    }

    const content = parts.length ? parts.join(' • ') : '—';
    return `<li><strong>${name}:</strong> ${content}</li>`;
  });

  listEl.innerHTML = items.join('');
  section.style.display = 'block';
}

function renderSpells(character) {
  const section = document.getElementById('charSpellsSection');
  const listEl = document.getElementById('charSpells');
  if (!section || !listEl) return;

  const selectedSpells = character.selectedSpells || [];

  const spellItems = selectedSpells.map((spell) => {
    const name = spell.name ? escapeHtml(spell.name) : 'Magia';
    const parts = [];

    if (spell.damage) parts.push(`Dano ${escapeHtml(spell.damage)}`);
    if (typeof spell.usageLimit === 'number') {
      parts.push(`Usos ${spell.usageLimit}x`);
    }
    if (spell.effects && spell.effects.length) {
      parts.push(`Efeitos: ${spell.effects.map((effect) => escapeHtml(effect)).join(', ')}`);
    }
    if (spell.description) {
      const description = formatMultilineText(spell.description);
      if (description) parts.push(description);
    }

    const content = parts.length ? parts.join(' • ') : '—';
    return `<li><strong>${name}:</strong> ${content}</li>`;
  });

  if (character.cantrips && character.cantrips.length) {
    spellItems.push(
      `<li><strong>Truques:</strong> ${character.cantrips.map((spell) => escapeHtml(spell)).join(', ')}</li>`
    );
  }

  if (character.knownSpells && character.knownSpells.length) {
    spellItems.push(
      `<li><strong>Magias Conhecidas:</strong> ${character.knownSpells.map((spell) => escapeHtml(spell)).join(', ')}</li>`
    );
  }

  if (character.preparedSpells && character.preparedSpells.length) {
    spellItems.push(
      `<li><strong>Magias Preparadas:</strong> ${character.preparedSpells.map((spell) => escapeHtml(spell)).join(', ')}</li>`
    );
  }

  if (!spellItems.length) {
    listEl.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  listEl.innerHTML = spellItems.join('');
  section.style.display = 'block';
}

function renderFeature(character) {
  const section = document.getElementById('charFeatureSection');
  const featureEl = document.getElementById('charFeature');

  if (!section || !featureEl) return;

  const featureParts = [];
  const feature = character.sheet?.feature;

  if (feature?.name || feature?.description) {
    const description = feature?.description ? formatMultilineText(feature.description) : null;
    if (description) {
      featureParts.push(`<strong>${escapeHtml(feature.name)}:</strong> ${description}`);
    } else if (feature?.name) {
      featureParts.push(`<strong>${escapeHtml(feature.name)}</strong>`);
    }
  }

  if (character.background?.featureNotes) {
    const featureNotes = formatMultilineText(character.background.featureNotes);
    if (featureNotes) {
      featureParts.push(featureNotes);
    }
  }

  if (!featureParts.length) {
    featureEl.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  featureEl.innerHTML = featureParts.join('<br><br>');
  section.style.display = 'block';
}

function populateCharacterDialog(character) {
  const overlay = document.getElementById('characterDialog');
  if (!overlay) return;

  const nameEl = document.getElementById('charName');
  const raceClassEl = document.getElementById('charRaceClass');
  const attributesEl = document.getElementById('charAttributes');
  const combatEl = document.getElementById('charCombatStats');
  const metaSectionEl = document.getElementById('charMetaSection');
  const detailsEl = document.getElementById('charDetails');
  const backgroundEl = document.getElementById('charBackground');
  const equipmentEl = document.getElementById('charEquipment');

  if (nameEl) {
    nameEl.textContent = character.name || 'Personagem';
  }

  if (raceClassEl) {
    const subtitleParts = [];
    if (character.race) subtitleParts.push(escapeHtml(character.race));
    if (character.class) subtitleParts.push(escapeHtml(character.class));
    if (character.subclass) subtitleParts.push(escapeHtml(character.subclass));
    if (character.sheet?.classLevel) subtitleParts.push(escapeHtml(character.sheet.classLevel));

    const ownerParticipant = sessionData?.participants?.find((participant) => participant.characterId === character.id);
    if (ownerParticipant?.username) {
      subtitleParts.push(`Jogador: ${escapeHtml(ownerParticipant.username)}`);
    }

    raceClassEl.innerHTML = subtitleParts.join(' • ');
  }

  if (attributesEl) {
    const attributes = character.attributes || {};
    const attributeItems = Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => {
      const value = attributes[key];
      if (typeof value !== 'number') {
        return `<li><strong>${label}:</strong> —</li>`;
      }
      return `<li><strong>${label}:</strong> ${value} (${formatAbilityModifier(value)})</li>`;
    });
    attributesEl.innerHTML = attributeItems.join('');
  }

  if (combatEl) {
    const combatStats = character.sheet?.combatStats || {};
    const combatItems = [];

    if (combatStats.armorClass !== undefined) {
      combatItems.push(`<li><strong>Classe de Armadura:</strong> ${combatStats.armorClass}</li>`);
    }
    if (combatStats.maxHp !== undefined) {
      combatItems.push(`<li><strong>PV Máximos:</strong> ${combatStats.maxHp}</li>`);
    }
    if (combatStats.currentHp !== undefined) {
      combatItems.push(`<li><strong>PV Atuais:</strong> ${combatStats.currentHp}</li>`);
    }
    if (combatStats.tempHp !== undefined && combatStats.tempHp > 0) {
      combatItems.push(`<li><strong>PV Temporários:</strong> ${combatStats.tempHp}</li>`);
    }
    if (combatStats.hitDice) {
      combatItems.push(`<li><strong>Dados de Vida:</strong> ${escapeHtml(combatStats.hitDice)}</li>`);
    }
    if (combatStats.initiative !== undefined) {
      combatItems.push(`<li><strong>Iniciativa:</strong> ${formatSignedNumber(combatStats.initiative)}</li>`);
    }
    if (combatStats.speed !== undefined) {
      combatItems.push(`<li><strong>Deslocamento:</strong> ${combatStats.speed} ft</li>`);
    }

    setListContent(combatEl, combatItems, 'Nenhuma informação de combate disponível');
  }

  const detailsItems = [];
  if (character.subclass) {
    detailsItems.push(`<li><strong>Subclasse:</strong> ${escapeHtml(character.subclass)}</li>`);
  }
  if (character.sheet?.backgroundName) {
    detailsItems.push(`<li><strong>Antecedente:</strong> ${escapeHtml(character.sheet.backgroundName)}</li>`);
  }
  if (character.sheet?.playerName) {
    detailsItems.push(`<li><strong>Jogador (ficha):</strong> ${escapeHtml(character.sheet.playerName)}</li>`);
  }
  if (character.sheet?.experiencePoints !== undefined) {
    detailsItems.push(`<li><strong>Pontos de Experiência:</strong> ${character.sheet.experiencePoints}</li>`);
  }
  if (character.createdAt) {
    const createdAtDate = new Date(character.createdAt);
    if (!Number.isNaN(createdAtDate.getTime())) {
      detailsItems.push(
        `<li><strong>Criado em:</strong> ${createdAtDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}</li>`
      );
    }
  }

  const metaHasContent = detailsItems.length > 0;
  setSectionVisibility(metaSectionEl, metaHasContent);
  if (metaHasContent) {
    setListContent(detailsEl, detailsItems, 'Nenhum detalhe adicional');
  }

  if (backgroundEl) {
    const background = character.background || {};
    const backgroundEntries = [
      { label: 'Aparência', value: background.appearance },
      { label: 'Personalidade', value: background.personality },
      { label: 'Medos', value: background.fears },
      { label: 'Objetivos', value: background.goals },
      { label: 'Traços', value: background.personalityTraits },
      { label: 'Ideais', value: background.ideals },
      { label: 'Vínculos', value: background.bonds },
      { label: 'Defeitos', value: background.flaws },
    ];

    const backgroundHtml = backgroundEntries
      .filter((entry) => entry.value)
      .map((entry) => {
        const formatted = formatMultilineText(entry.value);
        if (!formatted) return '';
        return `<strong>${entry.label}:</strong> ${formatted}`;
      })
      .filter(Boolean)
      .join('<br><br>');

    backgroundEl.innerHTML = backgroundHtml || '<em>História não informada.</em>';
  }

  if (equipmentEl) {
    const equipmentItems = (character.equipment || []).map((item) => `<li>${escapeHtml(item)}</li>`);
    setListContent(equipmentEl, equipmentItems, 'Nenhum equipamento cadastrado');
  }

  renderProficiencies(character.sheet?.proficiencies);
  renderAttacks(character);
  renderSpells(character);
  renderFeature(character);
}

window.viewCharacter = async function(characterId) {
  if (!characterId) {
    showNotification('Personagem não encontrado', 'error');
    return;
  }

  showCharacterDialogLoading();

  try {
    const character = await fetchCharacterCached(characterId);

    populateCharacterDialog(character);
  } catch (error) {
    console.error('Erro ao visualizar personagem:', error);
    window.closeCharacterDialog();
    const message = error?.message || 'Não foi possível carregar o personagem';
    showNotification(message, 'error');
  }
};

window.closeCharacterDialog = function() {
  document.getElementById('characterDialog').style.display = 'none';
};

async function handleLeave() {
  try {
    const token = getToken();
    await leaveRoom(sessionData.id, token);
    await new Promise(resolve => setTimeout(resolve, 300));
    unifiedPolling.stopAll();
    window.location.href = '/home.html';
  } catch (error) {
    console.error('Erro ao sair da sessão:', error);
    unifiedPolling.stopAll();
    window.location.href = '/home.html';
  }
}

async function refreshGameState(options = {}) {
  const { render = true } = options;
  try {
    if (!sessionData || !sessionData.id) {
      console.warn('[GAMEPLAY] sessionData não inicializado, pulando refresh');
      return;
    }
    const token = getToken();
    const gameStateResponse = await getGameState(sessionData.id, token);
    gameState = gameStateResponse.gameState;
    updateVotingContext();
    if (render) {
      renderStoryAndOptions();
    }
  } catch (error) {
    console.error('Erro ao atualizar estado do jogo:', error);
  }
}

async function refreshSessionData() {
  try {
    if (!sessionData || !sessionData.id) {
      console.warn('[GAMEPLAY] sessionData não inicializado, pulando refresh');
      return;
    }
    const token = getToken();
    const sessionDetailsResponse = await getSessionDetails(sessionData.id, token);
    sessionData = sessionDetailsResponse.session;
    updateVotingContext();
    renderCharacters();
    checkAllPlayersOnline();
  } catch (error) {
    console.error('Erro ao atualizar dados da sessão:', error);
  }
}

function startGamePolling(sessionId) {
  console.log('[GAMEPLAY] Iniciando polling de atualizações do jogo:', sessionId);

  unifiedPolling.startSessionPolling(sessionId, async (update) => {
    console.log('[GAME UPDATE]', update.type, update.data);

    switch (update.type) {
      case 'CHAT_MESSAGE':
        const msg = update.data;
        if (!loadedMessageIds.has(msg.id)) {
          loadedMessageIds.add(msg.id);
          appendChatMessage(msg);
        }
        break;

      case 'VOTE_RECEIVED': {
        const voteData = update.data || {};
        showNotification(`${voteData.characterName} votou!`, 'info');

        if (voteData.characterId && voteData.opcaoId) {
          const chapterForVote = lastVotingContext.chapter
            ? shallowCloneChapter(lastVotingContext.chapter)
            : (gameState?.currentChapter ? shallowCloneChapter(gameState.currentChapter) : null);

          if (chapterForVote) {
            const mergedVotes = { ...(lastVotingContext.votes || {}) };
            mergedVotes[voteData.characterId] = voteData.opcaoId;
            lastVotingContext = {
              chapter: chapterForVote,
              votes: mergedVotes,
            };
          }
        }

        await refreshGameState();
        break;
      }

      case 'VOTING_COMPLETE':
        showNotification('Votação concluída! Avançando história...', 'success');
        await refreshGameState({ render: false });
        break;

      case 'CHAPTER_CHANGED': {
        const isReverted = !!(update.data?.meta?.reverted);
        showNotification(
          isReverted ? 'História revertida pelo mestre.' : 'Novo capítulo!',
          isReverted ? 'warning' : 'success'
        );

        const newChapterData = update.data?.newChapter || null;
        const previousChapter = lastVotingContext.chapter || gameState?.currentChapter;
        const previousVotes = Object.keys(lastVotingContext.votes || {}).length > 0
          ? lastVotingContext.votes
          : gameState?.votes;
        const newChapterId = newChapterData?.id;

        let resultSummary = null;

        if (!isReverted) {
          resultSummary = computeVotingResultSummary(previousChapter, previousVotes, newChapterId);

          if (!resultSummary) {
            resultSummary = await fetchVotingResultFromTimeline();
          }
        }

        hasVoted = false;
        myVote = null;
        stopVotingProgressBar();

        const votingStatusEl = document.getElementById('votingStatus');
        if (votingStatusEl) {
          votingStatusEl.style.display = 'none';
        }

        const optionsContainerEl = document.getElementById('optionsContainer');
        if (optionsContainerEl) {
          optionsContainerEl.style.display = 'flex';
        }

        resetVotingContextForNextChapter(newChapterData);

        if (isReverted) {
          hideVotingResultOverlay(false);
          await refreshGameState();
        } else if (resultSummary) {
          const refreshPromise = refreshGameState({ render: false });
          const isCombatChapter = newChapterData?.isCombat === true;

          if (isCombatChapter) {
            showVotingResultOverlay(resultSummary, {
              onComplete: () => {
                refreshPromise.then(() => {
                  renderStoryAndOptions();
                });
              },
            });
          } else {
            showVotingResultOverlay(resultSummary, {
              onThreshold: () => {
                refreshPromise.then(() => {
                  renderStoryAndOptions();
                });
              },
            });
          }
          await refreshPromise;
        } else {
          hideVotingResultOverlay();
          await refreshGameState();
        }

        break;
      }

      case 'COMBAT_STARTED': {
        const combatMessage = update?.data?.message;
        const isInitialCombatStart = !combatMessage;

        if (isInitialCombatStart) {
          showNotification('⚔️ Combate iniciado!', 'warning');
        } else if (combatMessage) {
          showNotification(combatMessage, 'info');
        }

        await refreshCombatState({ render: !combatInitiativeOverlayVisible });
        if (combatInitiativeOverlayVisible) {
          updateInitiativeOverlayFromState();
          finalizeInitiativeOverlay();
        } else {
          renderCombatView();
        }

        if (isInitialCombatStart) {
          appendChatMessage({
            type: 'combat-system',
            content: '⚔️ Combate iniciado! Rolem iniciativa!',
            timestamp: new Date().toISOString()
          });
        } else if (combatMessage) {
          appendChatMessage({
            type: 'combat-system',
            content: `✅ ${combatMessage}`,
            timestamp: new Date().toISOString()
          });
        }
        break;
      }

      case 'ATTACK_MADE':
        await handleCombatAttackUpdate(update.data);
        break;

      case 'TURN_SKIPPED':
        await handleTurnSkippedUpdate(update.data);
        break;

      case 'COMBAT_ENDED':
        showNotification('Combate finalizado!', 'success');
        await refreshCombatState({ render: true });
        handleCombatEnded(true, update.data);
        break;

      case 'PLAYER_ROOM_JOINED':
      case 'PLAYER_ROOM_LEFT':
        refreshSessionData();
        break;

      case 'SESSION_STATE_CHANGED':
        if (update.data.newState === 'COMPLETED') {
          showNotification('A sessão foi concluída!', 'info');
          setTimeout(() => window.location.href = '/home.html', 3000);
        }
        break;

      case 'SESSION_DELETED':
        showNotification('A sessão foi encerrada pelo mestre', 'error');
        setTimeout(() => window.location.href = '/home.html', 2000);
        break;
    }
  }, 2000);

  unifiedPolling.startHeartbeat(sessionId, 15000);

  console.log('[GAMEPLAY] Polling iniciado:', unifiedPolling.getStats());
}

function setupEventListeners() {
  document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
  document.getElementById('leaveBtn').addEventListener('click', handleLeave);

  const cancelCombatActionBtn = document.getElementById('cancelCombatAction');
  if (cancelCombatActionBtn) {
    cancelCombatActionBtn.addEventListener('click', (event) => {
      event.preventDefault();
      closeCombatActionModal();
    });
  }

  const closeCombatActionBtn = document.getElementById('combatActionClose');
  if (closeCombatActionBtn) {
    closeCombatActionBtn.addEventListener('click', (event) => {
      event.preventDefault();
      closeCombatActionModal();
    });
  }

  const confirmCombatActionBtn = document.getElementById('confirmCombatAction');
  if (confirmCombatActionBtn) {
    confirmCombatActionBtn.addEventListener('click', (event) => {
      event.preventDefault();
      handlePerformAttack();
    });
  }
}

window.addEventListener('beforeunload', () => {
  unifiedPolling.stopAll();
  clearInitiativeIntervals();
});

async function initializeCombatFlow(chapter) {
  if (!sessionData || !sessionData.id) {
    return;
  }

  const isNewCombat = currentCombatChapterId !== chapter.id;
  if (isNewCombat) {
    currentCombatChapterId = chapter.id;
    combatLogEntries = [];
    hasRolledInitiative = false;
    initiativeResults.clear();
  }

  try {
    const token = getToken();
    await initiateCombat(sessionData.id, token);
  } catch (error) {
    const message = (error && error.message) ? error.message.toLowerCase() : '';
    if (!message.includes('já existe um combate')) {
      throw error;
    }
  }

  await refreshCombatState({ render: false });

  if (!combatState) {
    showNotification('Não foi possível carregar o estado do combate.', 'error');
    return;
  }

  await startInitiativePhase();
}

async function startInitiativePhase() {
  if (!combatState) return;

  await showCombatTransitionOverlay(INITIATIVE_PRE_DELAY_MS);

  const participants = combatState.participants || [];
  showInitiativeOverlay(participants);
  updateInitiativeOverlayFromState();

  startDiceAnimations(participants);

  if (combatState.turnOrder && combatState.turnOrder.length > 0) {
    finalizeInitiativeOverlay();
    return;
  }

  startInitiativePolling();
  attemptRollInitiative();
}

function clearInitiativeIntervals() {
  initiativeAnimationIntervals.forEach((intervalId) => clearInterval(intervalId));
  initiativeAnimationIntervals.clear();

  if (initiativePollingInterval) {
    clearInterval(initiativePollingInterval);
    initiativePollingInterval = null;
  }

  if (initiativeCountdownInterval) {
    clearInterval(initiativeCountdownInterval);
    initiativeCountdownInterval = null;
  }
}

async function showCombatTransitionOverlay(durationMs = INITIATIVE_PRE_DELAY_MS) {
  const overlay = document.getElementById('combatTransitionOverlay');
  const progressFill = document.getElementById('combatTransitionProgressFill');

  if (!overlay) {
    await delay(durationMs);
    return;
  }

  overlay.style.display = 'flex';

  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    // trigger reflow
    void progressFill.offsetWidth;
    progressFill.style.transition = `width ${durationMs}ms linear`;
    progressFill.style.width = '100%';
  }

  await delay(durationMs);

  overlay.style.display = 'none';
  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
  }
}

function showInitiativeOverlay(participants) {
  const overlay = document.getElementById('combatInitiativeOverlay');
  const grid = document.getElementById('initiativePlayers');
  const finalOrder = document.getElementById('initiativeFinalOrder');

  if (!overlay || !grid) return;

  grid.innerHTML = '';
  participants.forEach((participant) => {
    const card = document.createElement('div');
    card.className = 'initiative-player-card';
    card.dataset.characterId = participant.characterId;
    if (participant.characterId === currentCharacterId) {
      card.classList.add('current-user');
    }

    const diceId = `dice-${participant.characterId}`;
    const resultId = `result-${participant.characterId}`;

    card.innerHTML = `
      <div class="player-name">${escapeHtml(participant.characterName)}</div>
      <div class="initiative-dice rolling" id="${diceId}">--</div>
      <div class="initiative-result" id="${resultId}">Rolando...</div>
    `;

    grid.appendChild(card);
  });

  if (finalOrder) {
    finalOrder.style.display = 'none';
  }

  combatInitiativeOverlayVisible = true;
  overlay.style.display = 'flex';
}

function startDiceAnimations(participants) {
  if (!participants || !participants.length) return;

  participants.forEach((participant) => {
    startDiceAnimation(participant.characterId);
  });
}

function startDiceAnimation(characterId) {
  const diceEl = document.getElementById(`dice-${characterId}`);
  if (!diceEl) return;

  if (initiativeAnimationIntervals.has(characterId)) {
    clearInterval(initiativeAnimationIntervals.get(characterId));
  }

  diceEl.classList.add('rolling');
  let elapsed = 0;
  const duration = 5000;

  const interval = setInterval(() => {
    diceEl.textContent = (Math.floor(Math.random() * 20) + 1).toString();
    elapsed += 120;

    if (elapsed >= duration) {
      clearInterval(interval);
      initiativeAnimationIntervals.delete(characterId);
    }
  }, 120);

  initiativeAnimationIntervals.set(characterId, interval);
}

function stopDiceAnimation(characterId, value) {
  const interval = initiativeAnimationIntervals.get(characterId);
  if (interval) {
    clearInterval(interval);
    initiativeAnimationIntervals.delete(characterId);
  }

  const diceEl = document.getElementById(`dice-${characterId}`);
  if (diceEl) {
    diceEl.classList.remove('rolling');
    diceEl.textContent = value !== undefined ? value.toString() : '--';
  }
}

function updateInitiativeOverlayFromState() {
  if (!combatState) return;

  const participants = combatState.participants || [];
  participants.forEach((participant) => {
    if (participant.initiative !== undefined) {
      stopDiceAnimation(participant.characterId, participant.initiative);
      const resultEl = document.getElementById(`result-${participant.characterId}`);
      if (resultEl) {
        const rollInfo = initiativeResults.get(participant.characterId);
        if (rollInfo) {
          resultEl.innerHTML = `D20: ${rollInfo.d20Roll} + ${rollInfo.dexterityModifier} = <strong>${rollInfo.total}</strong>`;
        } else {
          resultEl.innerHTML = `Iniciativa: <strong>${participant.initiative}</strong>`;
        }
      }
    }
  });
}

async function attemptRollInitiative() {
  if (hasRolledInitiative || !combatState || !currentCharacterId) return;

  const participant = combatState.participants?.find((p) => p.characterId === currentCharacterId);
  if (!participant) {
    return;
  }

  if (participant.initiative !== undefined) {
    hasRolledInitiative = true;
    return;
  }

  hasRolledInitiative = true;

  try {
    const token = getToken();
    const response = await requestInitiative(sessionData.id, currentCharacterId, token);
    initiativeResults.set(currentCharacterId, response.roll);
    updateInitiativeOverlayFromState();

    if (response.allRolled) {
      await refreshCombatState({ render: false });
    }
  } catch (error) {
    console.error('[COMBAT] Erro ao rolar iniciativa:', error);
    showNotification(error?.message || 'Não foi possível rolar iniciativa', 'error');
    const message = (error && error.message) ? error.message.toLowerCase() : '';
    hasRolledInitiative = message.includes('já rolou');
  }
}

function startInitiativePolling() {
  if (initiativePollingInterval) return;

  initiativePollingInterval = setInterval(async () => {
    await refreshCombatState({ render: false });
  }, 1500);
}

function finalizeInitiativeOverlay() {
  if (!combatInitiativeOverlayVisible || !combatState || !combatState.turnOrder) {
    return;
  }

  clearInitiativeIntervals();
  updateInitiativeOverlayFromState();

  setTimeout(() => {
    const overlay = document.getElementById('combatInitiativeOverlay');
    const finalOrder = document.getElementById('initiativeFinalOrder');
    const orderList = document.getElementById('initiativeOrderList');
    const countdownEl = document.getElementById('initiativeCountdown');

    if (!overlay || !finalOrder || !orderList) return;

    finalOrder.style.display = 'block';
    orderList.innerHTML = '';

    combatState.turnOrder.forEach((entityId, index) => {
      const entityInfo = getCombatEntityInfo(entityId);
      if (!entityInfo) return;

      const li = document.createElement('li');
      li.className = entityInfo.type === 'ENEMY' ? 'enemy' : 'player';
      li.innerHTML = `
        <span>
          ${index + 1}. ${escapeHtml(entityInfo.name)}
        </span>
        <span>
          ${entityInfo.initiative !== undefined ? `Init: ${entityInfo.initiative}` : ''}
        </span>
      `;
      orderList.appendChild(li);
    });

    let countdown = 5;
    if (countdownEl) {
      countdownEl.textContent = countdown.toString();
    }

    initiativeCountdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdownEl) {
        countdownEl.textContent = countdown.toString();
      }

      if (countdown <= 0) {
        clearInitiativeIntervals();
        hideInitiativeOverlay();
      }
    }, 1000);
  }, 5000);
}

async function hideInitiativeOverlay() {
  const overlay = document.getElementById('combatInitiativeOverlay');
  if (!overlay) return;

  clearInitiativeIntervals();
  overlay.style.display = 'none';
  combatInitiativeOverlayVisible = false;
  initiativeResults.clear();

  renderCombatView();
}

async function refreshCombatState({ render = true } = {}) {
  if (!sessionData || !sessionData.id) {
    return null;
  }

  try {
    const token = getToken();
    const response = await fetchCombatState(sessionData.id, token);
    combatState = response.combatState;

    if (!combatState) {
      handleCombatEnded();
      return null;
    }

    if (combatState.turnOrder && combatState.turnOrder.length > 0 && combatInitiativeOverlayVisible) {
      updateInitiativeOverlayFromState();
      finalizeInitiativeOverlay();
    }

    if (render && !combatInitiativeOverlayVisible) {
      renderCombatView();
    }

    return combatState;
  } catch (error) {
    console.error('[COMBAT] Erro ao obter estado do combate:', error);
    return null;
  }
}

function renderCombatView() {
  const combatViewEl = document.getElementById('combatView');
  if (!combatViewEl) return;

  if (!combatState) {
    combatViewEl.style.display = 'none';
    return;
  }

  const storyTitleEl = document.querySelector('.story-card h2');
  if (storyTitleEl) {
    storyTitleEl.textContent = 'Combate';
  }

  combatViewEl.style.display = 'flex';
  combatViewInitialized = true;

  renderCombatTurnOrder();
  renderCombatEntities();
  renderCombatActions();
  renderCombatLog();
}

async function showEnemyActionStep({ title, description, duration }) {
  const overlay = document.getElementById('enemyActionOverlay');
  const titleEl = document.getElementById('enemyActionTitle');
  const descriptionEl = document.getElementById('enemyActionDescription');
  const progressFill = document.getElementById('enemyActionProgressFill');

  if (!overlay) {
    await delay(duration);
    return;
  }

  overlay.style.display = 'flex';
  if (titleEl) titleEl.textContent = title;
  if (descriptionEl) descriptionEl.textContent = description;

  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    void progressFill.offsetWidth;
    progressFill.style.transition = `width ${duration}ms linear`;
    progressFill.style.width = '100%';
  }

  await delay(duration);

  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
  }
}

function hideEnemyActionOverlay() {
  const overlay = document.getElementById('enemyActionOverlay');
  const progressFill = document.getElementById('enemyActionProgressFill');
  if (overlay) {
    overlay.style.display = 'none';
  }
  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
  }
}

function getAttackAnimationElements() {
  const overlay = document.getElementById('attackAnimationOverlay');
  if (!overlay) {
    return null;
  }

  return {
    overlay,
    title: document.getElementById('attackAnimationTitle'),
    attackerInfo: document.getElementById('attackerInfo'),
    targetInfo: document.getElementById('targetInfo'),
    diceRoll: document.getElementById('attackDiceRoll'),
    rollFormula: document.getElementById('attackRollFormula'),
    resultContainer: document.getElementById('attackResult'),
    resultText: document.getElementById('attackResultText'),
    damageSection: document.getElementById('damageRollSection'),
    damageDice: document.getElementById('damageDiceRoll'),
    damageFormula: document.getElementById('damageRollFormula'),
    damageTotal: document.getElementById('damageTotal'),
  };
}

async function animateDiceRoll(element, duration, sides) {
  if (!element) {
    await delay(duration);
    return;
  }

  let elapsed = 0;
  const intervalMs = 120;

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      elapsed += intervalMs;
      const roll = rollDie(sides);
      element.textContent = roll.toString();

      if (elapsed >= duration) {
        clearInterval(interval);
        resolve();
      }
    }, intervalMs);
  });
}

async function animateDamageRoll(elements, damageDetails) {
  const { damageSection, damageDice, damageFormula, damageTotal } = elements;
  if (!damageSection || !damageDice || !damageDetails) {
    await delay(ENEMY_DAMAGE_ANIMATION_DURATION_MS);
    return;
  }

  damageSection.style.display = 'block';
  damageDice.classList.add('rolling');
  damageDice.textContent = '--';

  if (damageFormula) {
    damageFormula.textContent = `Rolando ${damageDetails.formula}`;
  }

  await animateDiceRoll(damageDice, ENEMY_DAMAGE_ANIMATION_DURATION_MS, damageDetails.sides);

  damageDice.classList.remove('rolling');
  damageDice.textContent = damageDetails.rolls.join(' + ');

  if (damageTotal) {
    const modifierText = damageDetails.modifier ? (damageDetails.modifier > 0 ? ` + ${damageDetails.modifier}` : ` - ${Math.abs(damageDetails.modifier)}`) : '';
    const typeText = damageDetails.type ? ` (${damageDetails.type})` : '';
    damageTotal.textContent = `Total: ${damageDetails.sum}${modifierText} = ${damageDetails.total}${typeText}`;
  }

  await delay(1500);
}

function resetAttackAnimationOverlay(elements) {
  if (!elements) return;
  if (elements.diceRoll) {
    elements.diceRoll.classList.remove('rolling', 'critical-20', 'critical-1');
    elements.diceRoll.textContent = '--';
  }
  if (elements.resultContainer) {
    elements.resultContainer.style.display = 'none';
    const attackerDamageSection = elements.overlay?.querySelector('.attacker-damage-section');
    if (attackerDamageSection) {
      attackerDamageSection.remove();
    }
  }
  if (elements.resultText) {
    elements.resultText.className = 'result-text';
  }
  if (elements.damageSection) {
    elements.damageSection.style.display = 'none';
    elements.damageSection.classList.remove('critical');
  }
  if (elements.damageDice) {
    elements.damageDice.classList.remove('rolling');
    elements.damageDice.textContent = '--';
  }
  if (elements.damageFormula) {
    elements.damageFormula.textContent = '';
  }
  if (elements.damageTotal) {
    elements.damageTotal.textContent = '';
  }
}

async function showAttackRollOverlay({
  attackerName,
  targetName,
  attackName,
  attackRoll,
  damageDetail,
  hit,
  damageTotal,
  critical,
  criticalFail,
  criticalFailDamage,
}) {
  const elements = getAttackAnimationElements();

  if (!elements) {
    const duration = ENEMY_ATTACK_ROLL_DURATION_MS + (damageDetail ? ENEMY_DAMAGE_ANIMATION_DURATION_MS : 0) + 1500;
    await delay(duration);
    return;
  }

  const {
    overlay,
    title,
    attackerInfo,
    targetInfo,
    diceRoll,
    rollFormula,
    resultContainer,
    resultText,
    damageSection,
    damageDice,
    damageFormula,
    damageTotal: damageTotalEl,
  } = elements;

  overlay.style.display = 'flex';

  if (title) title.textContent = `Rolando ${attackName}`;
  if (attackerInfo) attackerInfo.textContent = attackerName || 'Atacante';
  if (targetInfo) targetInfo.textContent = targetName ? `Alvo: ${targetName}` : '';

  if (rollFormula) {
    const bonus = attackRoll?.attackBonus ?? attackRoll?.modifier ?? 0;
    rollFormula.textContent = `d20 + ${bonus >= 0 ? `+${bonus}` : bonus}`;
  }

  if (resultContainer) resultContainer.style.display = 'none';
  if (damageSection) damageSection.style.display = 'none';
  if (diceRoll) {
    diceRoll.classList.add('rolling');
    diceRoll.classList.remove('critical-20', 'critical-1');
    diceRoll.textContent = '--';
  }

  await animateDiceRoll(diceRoll, ENEMY_ATTACK_ROLL_DURATION_MS, 20);

  const finalRoll = attackRoll?.d20 ?? attackRoll?.d20Roll ?? 0;
  const isCritical = critical === true || finalRoll === 20;
  const isCriticalFail = criticalFail === true || finalRoll === 1;

  if (diceRoll) {
    diceRoll.classList.remove('rolling');
    diceRoll.textContent = String(finalRoll);

    if (isCritical) {
      diceRoll.classList.add('critical-20');
      await delay(2400);
      diceRoll.classList.remove('critical-20');
    } else if (isCriticalFail) {
      diceRoll.classList.add('critical-1');
      await delay(2400);
      diceRoll.classList.remove('critical-1');
    }
  }

  if (resultContainer) resultContainer.style.display = 'block';
  if (resultText) {
    const totalAttack = attackRoll?.total ?? attackRoll?.totalAttack ?? '--';
    const targetAC = attackRoll?.targetAC ?? '--';

    if (isCritical) {
      resultText.textContent = `🎯 CRÍTICO! Acerto automático!`;
      resultText.className = 'result-text hit critical';
    } else if (isCriticalFail) {
      resultText.textContent = `💥 FALHA CRÍTICA! Erro automático!`;
      resultText.className = 'result-text miss critical-fail';
    } else if (hit) {
      resultText.textContent = `Acerto! ${totalAttack} >= CA ${targetAC}`;
      resultText.className = 'result-text hit';
    } else {
      resultText.textContent = `Erro! ${totalAttack} < CA ${targetAC}`;
      resultText.className = 'result-text miss';
    }
  }

  if (isCriticalFail && typeof criticalFailDamage === 'number' && criticalFailDamage > 0) {
    let attackerDamageSection = overlay.querySelector('.attacker-damage-section');
    if (!attackerDamageSection) {
      attackerDamageSection = document.createElement('div');
      attackerDamageSection.className = 'attacker-damage-section';
      attackerDamageSection.innerHTML = `
        <div class="damage-label">💥 ${attackerName} se machuca!</div>
        <div class="dice-display damage-dice rolling" id="attackerDamageDice">--</div>
        <p class="damage-total" id="attackerDamageTotal"></p>
      `;
      resultContainer.appendChild(attackerDamageSection);
    }

    const attackerDamageDice = attackerDamageSection.querySelector('#attackerDamageDice');
    const attackerDamageTotalEl = attackerDamageSection.querySelector('#attackerDamageTotal');

    if (attackerDamageDice) {
      attackerDamageDice.classList.add('rolling');
      attackerDamageDice.textContent = '--';
    }

    await animateDiceRoll(attackerDamageDice, ENEMY_DAMAGE_ANIMATION_DURATION_MS, 4);

    if (attackerDamageDice) {
      attackerDamageDice.classList.remove('rolling');
      attackerDamageDice.textContent = String(criticalFailDamage);
    }

    if (attackerDamageTotalEl) {
      attackerDamageTotalEl.textContent = `Dano sofrido: ${criticalFailDamage}`;
    }

    await delay(2000);
  } else if (hit && damageDetail) {
    if (damageSection) {
      damageSection.style.display = 'block';
      if (isCritical) {
        damageSection.classList.add('critical');
      } else {
        damageSection.classList.remove('critical');
      }
    }

    if (damageDice) {
      damageDice.classList.add('rolling');
      damageDice.textContent = '--';
    }

    if (damageFormula) {
      const expression = isCritical && damageDetail.expression ? damageDetail.expression.replace(/(\d+)d(\d+)/, (match, count, sides) => `${parseInt(count) * 2}d${sides}`) : damageDetail.expression;
      damageFormula.textContent = `Rolando ${expression || (isCritical ? '2d8' : '1d8')}`;
    }

    await animateDiceRoll(damageDice, ENEMY_DAMAGE_ANIMATION_DURATION_MS, damageDetail.sides || 8);

    if (damageDice) {
      damageDice.classList.remove('rolling');
      if (Array.isArray(damageDetail.rolls) && damageDetail.rolls.length) {
        damageDice.textContent = damageDetail.rolls.join(' + ');
      } else {
        damageDice.textContent = String(damageDetail.total ?? '');
      }
    }

    if (damageTotalEl) {
      const modifierText = damageDetail.modifier ? (damageDetail.modifier > 0 ? ` + ${damageDetail.modifier}` : ` - ${Math.abs(damageDetail.modifier)}`) : '';
      const typeText = damageDetail.type ? ` (${damageDetail.type})` : '';
      const displayTotal = damageDetail.total ?? damageTotal ?? 0;
      const criticalLabel = isCritical ? ' (CRÍTICO!)' : '';
      damageTotalEl.textContent = `Total: ${displayTotal}${modifierText}${typeText}${criticalLabel}`;
    }
  } else if (!hit) {
    await delay(2000);
  }

  await delay(1500);
  overlay.style.display = 'none';
  resetAttackAnimationOverlay(elements);
}

async function playAttackAnimationFromUpdate(update = {}) {
  const attackerType = update.attackerType || 'PLAYER';
  const attackerName = update.attackerName || 'Atacante';
  const targetName = update.targetName || 'Alvo';
  const attackName = update.attackName || 'Ataque';
  const attackRoll = update.attackRoll || null;
  const damageDetail = update.damageDetail || null;
  const hit = update.hit === true;
  const damageTotal = typeof update.damage === 'number' ? update.damage : (damageDetail?.total ?? null);
  const critical = update.critical === true;
  const criticalFail = update.criticalFail === true;
  const criticalFailDamage = update.criticalFailDamage ?? null;

  if (attackerType === 'ENEMY') {
    await showEnemyActionStep({
      title: `${attackerName} observa o campo`,
      description: `${attackerName} avalia os aventureiros antes de agir.`,
      duration: ENEMY_PRE_TURN_DELAY_MS,
    });

    await showEnemyActionStep({
      title: `${attackerName} escolhe ${targetName}`,
      description: `${attackerName} foca em ${targetName} como próximo alvo.`,
      duration: ENEMY_TARGET_SELECTION_DURATION_MS,
    });

    await showEnemyActionStep({
      title: `${attackerName} prepara ${attackName}`,
      description: `${attackerName} posiciona-se para atacar.`,
      duration: ENEMY_ATTACK_SELECTION_DURATION_MS,
    });

    hideEnemyActionOverlay();
  }

  await showAttackRollOverlay({
    attackerName,
    targetName,
    attackName,
    attackRoll,
    damageDetail,
    hit,
    damageTotal,
    critical,
    criticalFail,
    criticalFailDamage,
  });
}


function getCombatEntityInfo(entityId) {
  if (!combatState) return null;

  const participant = combatState.participants?.find((p) => p.characterId === entityId);
  if (participant) {
    return {
      id: participant.characterId,
      name: participant.characterName,
      type: 'PLAYER',
      hp: participant.hp,
      maxHp: participant.maxHp,
      isDead: !!participant.isDead,
      initiative: participant.initiative,
    };
  }

  const enemy = combatState.enemies?.find((e) => e.id === entityId);
  if (enemy) {
    return {
      id: enemy.id,
      name: enemy.name,
      type: 'ENEMY',
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      isDead: !!enemy.isDead,
      initiative: enemy.initiative,
    };
  }

  return null;
}

function renderCombatTurnOrder() {
  const listEl = document.getElementById('combatTurnOrder');
  if (!listEl || !combatState) return;

  listEl.innerHTML = '';

  const turnOrder = combatState.turnOrder || [];
  const currentTurnIndex = combatState.currentTurnIndex ?? 0;

  turnOrder.forEach((entityId, index) => {
    const entity = getCombatEntityInfo(entityId);
    if (!entity) return;

    const li = document.createElement('li');
    li.classList.add(entity.type === 'ENEMY' ? 'enemy' : 'player');
    if (index === currentTurnIndex && combatState.isActive) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <span>${index + 1}. ${escapeHtml(entity.name)}</span>
      <span>${entity.initiative !== undefined ? `Init: ${entity.initiative}` : ''}</span>
    `;

    listEl.appendChild(li);
  });
}

function renderCombatEntities() {
  const alliesEl = document.getElementById('combatAllies');
  const enemiesEl = document.getElementById('combatEnemies');

  if (!combatState || !alliesEl || !enemiesEl) return;

  alliesEl.innerHTML = '';
  enemiesEl.innerHTML = '';

  (combatState.participants || []).forEach((participant) => {
    const card = document.createElement('div');
    card.className = 'combat-entity-card';
    if (participant.isDead) {
      card.classList.add('dead');
    }
    if (combatState.turnOrder?.[combatState.currentTurnIndex] === participant.characterId && combatState.isActive) {
      card.classList.add('current-turn');
    }

    const hpPercent = participant.maxHp ? Math.max(0, Math.min(100, Math.round((participant.hp / participant.maxHp) * 100))) : 0;
    const turnIndex = combatState.turnOrder ? combatState.turnOrder.indexOf(participant.characterId) : -1;

    card.innerHTML = `
      ${turnIndex >= 0 ? `<div class="turn-badge">${turnIndex + 1}</div>` : ''}
      <div class="entity-name">${escapeHtml(participant.characterName)}</div>
      <div class="entity-hp-bar">
        <div class="entity-hp-fill" style="width: ${hpPercent}%"></div>
      </div>
      <div class="entity-meta">HP: ${participant.hp} / ${participant.maxHp}</div>
      <div class="entity-meta">Iniciativa: ${participant.initiative !== undefined ? participant.initiative : '--'}</div>
    `;

    alliesEl.appendChild(card);
  });

  (combatState.enemies || []).forEach((enemy) => {
    const card = document.createElement('div');
    card.className = 'combat-entity-card enemy';
    if (enemy.isDead) {
      card.classList.add('dead');
    }
    if (combatState.turnOrder?.[combatState.currentTurnIndex] === enemy.id && combatState.isActive) {
      card.classList.add('current-turn');
    }

    const hpPercent = enemy.maxHp ? Math.max(0, Math.min(100, Math.round((enemy.hp / enemy.maxHp) * 100))) : 0;
    const turnIndex = combatState.turnOrder ? combatState.turnOrder.indexOf(enemy.id) : -1;

    card.innerHTML = `
      <button class="view-enemy-btn" data-enemy-id="${enemy.id}" title="Ver ficha do inimigo">👁</button>
      ${turnIndex >= 0 ? `<div class="turn-badge">${turnIndex + 1}</div>` : ''}
      <div class="entity-name">${escapeHtml(enemy.name)}</div>
      <div class="entity-hp-bar">
        <div class="entity-hp-fill" style="width: ${hpPercent}%"></div>
      </div>
      <div class="entity-meta">HP: ${enemy.hp} / ${enemy.maxHp}</div>
      <div class="entity-meta">Iniciativa: ${enemy.initiative !== undefined ? enemy.initiative : '--'}</div>
    `;

    const eyeBtn = card.querySelector('.view-enemy-btn');
    if (eyeBtn) {
      eyeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await showEnemySheet(enemy);
      });
    }

    enemiesEl.appendChild(card);
  });
}

async function showEnemySheet(enemy) {
  if (!enemy) return;

  if (sessionData?.storyId) {
    await loadMonsterData(sessionData.storyId);
  }

  const monsterId = resolveMonsterLookupId(enemy);
  const fallbackData = monsterId ? getMonsterById(monsterId) : null;

  const merged = { ...(fallbackData || {}), ...(enemy || {}) };
  merged.abilities = enemy.abilities || fallbackData?.abilities || null;
  merged.skills = enemy.skills || fallbackData?.skills || null;
  merged.senses = enemy.senses || fallbackData?.senses || null;
  merged.languages = enemy.languages || fallbackData?.languages || [];
  merged.traits = enemy.traits || fallbackData?.traits || [];
  merged.actions = enemy.actions || fallbackData?.actions || [];
  merged.hitPoints = enemy.maxHp ?? enemy.hp ?? fallbackData?.hitPoints ?? fallbackData?.hp ?? null;
  merged.hitDice = enemy.hitDice || fallbackData?.hitDice || null;
  merged.armorClass = enemy.ac ?? enemy.armorClass ?? fallbackData?.armorClass ?? null;
  merged.xp = enemy.xp ?? fallbackData?.xp ?? null;
  merged.size = enemy.size || fallbackData?.size || null;
  merged.type = enemy.type || fallbackData?.type || null;
  merged.alignment = enemy.alignment || fallbackData?.alignment || null;

  if (!merged.abilities || Object.keys(merged.abilities).length === 0 || !Array.isArray(merged.actions) || merged.actions.length === 0) {
    showNotification('Informações do inimigo não disponíveis', 'warning');
    return;
  }

  const characterDialog = document.getElementById('characterDialog');
  const characterDialogContent = document.getElementById('characterDialogContent');

  if (!characterDialog || !characterDialogContent) return;

  const abilityOrder = [
    { label: 'FOR', key: 'strength' },
    { label: 'DES', key: 'dexterity' },
    { label: 'CON', key: 'constitution' },
    { label: 'INT', key: 'intelligence' },
    { label: 'SAB', key: 'wisdom' },
    { label: 'CAR', key: 'charisma' },
  ];

  const formatAbilityScore = (value) => {
    if (typeof value !== 'number') return '--';
    const mod = getAbilityModifier(value);
    const modText = mod >= 0 ? `+${mod}` : `${mod}`;
    return `${value} (${modText})`;
  };

  const hpDisplay = merged.hitPoints !== null
    ? `${merged.hitPoints}${merged.hitDice ? ` (${merged.hitDice})` : ''}`
    : (merged.maxHp !== undefined ? `${merged.maxHp}` : '--');

  const armorClassDisplay = merged.armorClass !== null ? merged.armorClass : '--';
  const xpDisplay = merged.xp !== null ? merged.xp : '--';
  const languages = Array.isArray(merged.languages) ? merged.languages : (merged.languages ? [merged.languages] : []);
  const traits = Array.isArray(merged.traits) ? merged.traits : [];
  const actions = Array.isArray(merged.actions) ? merged.actions : [];

  const html = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="border-bottom: 2px solid var(--primary-gold); padding-bottom: 15px;">
        <h3 style="margin: 0; color: var(--primary-gold);">${escapeHtml(merged.name || enemy.name || 'Inimigo')}</h3>
        <p style="margin: 5px 0 0; font-style: italic; color: var(--silver);">
          ${escapeHtml(merged.size || 'Desconhecido')} ${escapeHtml(merged.type || '')}${merged.alignment ? `, ${escapeHtml(merged.alignment)}` : ''}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        <div>
          <strong>CA:</strong> ${escapeHtml(String(armorClassDisplay))}
        </div>
        <div>
          <strong>HP:</strong> ${escapeHtml(String(hpDisplay))}
        </div>
        <div>
          <strong>XP:</strong> ${escapeHtml(String(xpDisplay))}
        </div>
      </div>

      <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 15px;">
        <h4 style="margin: 0 0 10px; color: var(--primary-gold);">Atributos</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.9rem;">
          ${abilityOrder.map(({ label, key }) => `
            <div><strong>${label}:</strong> ${escapeHtml(formatAbilityScore(merged.abilities?.[key]))}</div>
          `).join('')}
        </div>
      </div>

      ${traits.length > 0 ? `
        <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 15px;">
          <h4 style="margin: 0 0 10px; color: var(--primary-gold);">Traços</h4>
          ${traits.map(trait => `
            <div style="margin-bottom: 10px;">
              <strong style="color: var(--secondary-gold);">${escapeHtml(trait.name)}.</strong>
              ${trait.description ? escapeHtml(trait.description) : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${actions.length > 0 ? `
        <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 15px;">
          <h4 style="margin: 0 0 10px; color: var(--primary-gold);">Ações</h4>
          ${actions.map(action => {
            const parts = [];
            if (action.type) parts.push(`<em>${escapeHtml(action.type)}</em>`);
            if (typeof action.attackBonus === 'number') parts.push(`${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus} para acertar`);
            if (action.reach) parts.push(`alcance ${escapeHtml(String(action.reach))} pés`);
            if (action.range) parts.push(`alcance ${escapeHtml(action.range)}`);
            if (action.damage) parts.push(`dano ${escapeHtml(action.damage)}`);

            let actionText = `<strong style="color: var(--secondary-gold);">${escapeHtml(action.name || 'Ação')}.</strong> `;
            if (parts.length) {
              actionText += `${parts.join(', ')}. `;
            }
            if (action.description) {
              actionText += escapeHtml(action.description);
            }
            if (action.effect) {
              actionText += ` <em>${escapeHtml(action.effect)}</em>`;
            }
            return `<div style="margin-bottom: 10px;">${actionText}</div>`;
          }).join('')}
        </div>
      ` : ''}

      ${languages.length > 0 ? `
        <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 15px;">
          <strong>Idiomas:</strong> ${languages.map(lang => escapeHtml(String(lang))).join(', ')}
        </div>
      ` : ''}
    </div>
  `;

  characterDialogContent.innerHTML = html;
  characterDialog.style.display = 'flex';
}

function renderCombatActions() {
  const actionsEl = document.getElementById('combatActions');
  if (!actionsEl || !combatState) return;

  actionsEl.innerHTML = '';

  const turnOrder = combatState.turnOrder || [];
  const currentTurnIndex = combatState.currentTurnIndex ?? 0;
  const currentEntityId = turnOrder[currentTurnIndex];
  const myParticipant = combatState.participants?.find((p) => p.characterId === currentCharacterId);
  const currentEntity = getCombatEntityInfo(currentEntityId);
  const isMyTurn = combatState.isActive && currentEntityId === currentCharacterId && myParticipant && !myParticipant.isDead;

  const indicator = document.createElement('div');
  indicator.className = 'turn-indicator';

  if (!combatState.isActive) {
    indicator.textContent = 'Combate encerrado. Aguardando próxima decisão.';
    actionsEl.appendChild(indicator);
    return;
  }

  if (!myParticipant) {
    indicator.textContent = 'Você não participa deste combate.';
    actionsEl.appendChild(indicator);
    return;
  }

  if (myParticipant.isDead) {
    indicator.textContent = 'Você está incapacitado. Aguarde o fim do combate ou uma tentativa de reviver.';
    actionsEl.appendChild(indicator);
    return;
  }

  if (isMyTurn) {
    indicator.textContent = 'É sua vez! Escolha sua ação.';
    actionsEl.appendChild(indicator);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'actions-buttons';

    const attackButton = document.createElement('button');
    attackButton.className = 'btn btn-primary';
    attackButton.textContent = 'Atacar';
    attackButton.addEventListener('click', openCombatActionModal);

    const skipButton = document.createElement('button');
    skipButton.className = 'btn btn-secondary';
    skipButton.textContent = 'Pular a vez';
    skipButton.addEventListener('click', handleSkipTurn);

    buttonsContainer.appendChild(attackButton);
    buttonsContainer.appendChild(skipButton);
    actionsEl.appendChild(buttonsContainer);

    const hint = document.createElement('div');
    hint.className = 'info-message';
    hint.textContent = 'Pular a vez concede uma pequena recuperação de vida.';
    actionsEl.appendChild(hint);
  } else {
    closeCombatActionModal();
    const waitingName = currentEntity ? currentEntity.name : 'o próximo combatente';
    indicator.textContent = `Aguardando turno de ${waitingName}.`;
    actionsEl.appendChild(indicator);
  }
}

async function openCombatActionModal() {
  const modal = document.getElementById('combatActionModal');
  const attacksContainer = document.getElementById('combatActionAttacks');
  const targetsContainer = document.getElementById('combatActionTargets');
  const confirmBtn = document.getElementById('confirmCombatAction');

  if (!modal || !attacksContainer || !targetsContainer || !combatState) return;

  combatActionSelection = {
    attackId: null,
    attackName: null,
    targetId: null,
  };

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirmar';
  }

  attacksContainer.innerHTML = '';
  targetsContainer.innerHTML = '';

  const character = await fetchCharacterCached(currentCharacterId);
  const attackSources = character?.sheet?.attacks || character?.attacks || character?.selectedAttacks || [];

  const attacks = attackSources.map((attack, index) => {
    if (typeof attack === 'string') {
      return {
        id: `${index}-${attack}`,
        name: attack,
        description: '',
      };
    }

    return {
      id: attack.id || attack.name || `attack-${index}`,
      name: attack.name || attack.titulo || `Ataque ${index + 1}`,
      description: attack.description || attack.descricao || attack.texto || '',
    };
  });

  if (!attacks.length) {
    const empty = document.createElement('p');
    empty.className = 'info-message';
    empty.textContent = 'Nenhum ataque ou magia cadastrada para este personagem.';
    attacksContainer.appendChild(empty);
  } else {
    attacks.forEach((attack) => {
      const card = document.createElement('div');
      card.className = 'action-card';
      card.dataset.attackId = attack.id;
      card.innerHTML = `
        <strong>${escapeHtml(attack.name)}</strong>
        <p style="margin-top: 6px; font-size: 0.85rem; color: var(--silver);">${attack.description ? escapeHtml(attack.description) : 'Ataque básico.'}</p>
      `;
      card.addEventListener('click', () => selectCombatAttack(attack));
      attacksContainer.appendChild(card);
    });
  }

  const spellsContainer = document.getElementById('combatActionSpells');
  const spellSources = character?.sheet?.spells || character?.selectedSpells || [];

  if (spellsContainer && spellSources.length > 0) {
    spellsContainer.style.display = 'grid';
    spellsContainer.innerHTML = '';

    const spellsHeader = document.createElement('h4');
    spellsHeader.textContent = 'Magias';
    spellsHeader.style.gridColumn = '1 / -1';
    spellsHeader.style.color = 'var(--primary-gold)';
    spellsHeader.style.marginTop = '10px';
    spellsHeader.style.marginBottom = '5px';
    spellsContainer.appendChild(spellsHeader);

    spellSources.forEach((spell, idx) => {
      const spellCard = document.createElement('div');
      spellCard.className = 'action-card';
      spellCard.dataset.spellId = `spell_${idx}`;

      const spellName = spell.name || spell.nome || `Magia ${idx + 1}`;
      const spellDesc = spell.description || spell.descricao || spell.effect || spell.efeito || 'Efeito mágico';
      const spellDamage = spell.damage || spell.dano || null;

      spellCard.innerHTML = `
        <strong>${escapeHtml(spellName)}</strong>
        <p style="margin-top: 6px; font-size: 0.85rem; color: var(--silver);">${escapeHtml(spellDesc)}</p>
        ${spellDamage ? `<p style="font-size: 0.85rem; color: var(--secondary-gold);"><strong>Dano:</strong> ${escapeHtml(spellDamage)}</p>` : ''}
      `;

      spellCard.addEventListener('click', () => selectCombatAttack({
        id: `spell_${idx}`,
        name: spellName,
        description: spellDesc
      }));

      spellsContainer.appendChild(spellCard);
    });
  } else if (spellsContainer) {
    spellsContainer.style.display = 'none';
  }

  const aliveEnemies = (combatState.enemies || []).filter((enemy) => !enemy.isDead);

  if (!aliveEnemies.length) {
    const emptyTarget = document.createElement('p');
    emptyTarget.className = 'info-message';
    emptyTarget.textContent = 'Nenhum inimigo disponível para ataque.';
    targetsContainer.appendChild(emptyTarget);
  } else {
    aliveEnemies.forEach((enemy) => {
      const card = document.createElement('div');
      card.className = 'action-card enemy-target';
      card.dataset.targetId = enemy.id;
      const hpLabel = `${enemy.hp} / ${enemy.maxHp}`;
      card.innerHTML = `
        <strong>${escapeHtml(enemy.name)}</strong>
        <p style="margin-top: 6px; font-size: 0.85rem; color: var(--silver);">HP: ${hpLabel}</p>
      `;
      card.addEventListener('click', () => selectCombatTarget(enemy.id));
      targetsContainer.appendChild(card);
    });
  }

  modal.style.display = 'flex';
}

function closeCombatActionModal() {
  const modal = document.getElementById('combatActionModal');
  if (!modal) return;
  modal.style.display = 'none';
  combatActionSelection = {
    attackId: null,
    attackName: null,
    targetId: null,
  };
  updateCombatActionConfirmState();
}

function selectCombatAttack(attack) {
  combatActionSelection.attackId = attack.id;
  combatActionSelection.attackName = attack.name;

  const cards = document.querySelectorAll('#combatActionAttacks .action-card');
  cards.forEach((card) => {
    card.classList.toggle('selected', card.dataset.attackId === attack.id);
  });

  updateCombatActionConfirmState();
}

function selectCombatTarget(targetId) {
  combatActionSelection.targetId = targetId;

  const cards = document.querySelectorAll('#combatActionTargets .action-card');
  cards.forEach((card) => {
    card.classList.toggle('selected', card.dataset.targetId === targetId);
  });

  updateCombatActionConfirmState();
}

function updateCombatActionConfirmState() {
  const confirmBtn = document.getElementById('confirmCombatAction');
  if (!confirmBtn) return;

  const canConfirm = !!combatActionSelection.targetId;
  confirmBtn.disabled = !canConfirm;
}

async function handlePerformAttack() {
  if (!combatState || !combatActionSelection.targetId || !currentCharacterId) {
    return;
  }

  const confirmBtn = document.getElementById('confirmCombatAction');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Executando...';
  }

  try {
    const token = getToken();
    await executeCombatAttack(sessionData.id, currentCharacterId, combatActionSelection.targetId, token);
    showNotification('Ataque realizado!', 'success');
  } catch (error) {
    handleError(error);
  } finally {
    closeCombatActionModal();
    await refreshCombatState({ render: true });
  }
}

async function handleSkipTurn(event) {
  if (event) {
    event.preventDefault();
  }

  if (!combatState || !currentCharacterId) return;

  try {
    const token = getToken();
    const response = await requestSkipTurn(sessionData.id, currentCharacterId, token);

    if (response?.healed) {
      const amount = response.healed.amount || 0;
      if (amount > 0) {
        showNotification(`Você recuperou ${amount} ponto${amount === 1 ? '' : 's'} de vida.`, 'info');
      } else {
        showNotification('Você manteve sua vida atual.', 'info');
      }
    }
  } catch (error) {
    handleError(error);
  } finally {
    await refreshCombatState({ render: true });
  }
}

function renderCombatLog() {
  const logEl = document.getElementById('combatLog');
  if (!logEl) return;

  if (!combatLogEntries.length) {
    logEl.innerHTML = '<p class="info-message" style="opacity:0.75;">Nenhuma ação registrada ainda.</p>';
    return;
  }

  logEl.innerHTML = combatLogEntries.map((entry) => `<div class="combat-log-entry">${entry}</div>`).join('');
  logEl.scrollTop = logEl.scrollHeight;
}

function addCombatLogEntry(message) {
  if (!message) return;
  combatLogEntries.push(escapeHtml(message));
  if (combatLogEntries.length > 30) {
    combatLogEntries.shift();
  }
  renderCombatLog();
}

async function handleCombatAttackUpdate(data = {}) {
  const {
    attackerId,
    attackerName,
    targetName,
    hit,
    damage,
    damageDetail,
    critical,
    criticalFail,
    criticalFailDamage,
    combatEnded,
    winningSide,
  } = data;

  const isPlayerAttack = combatState?.participants?.some(p => p.characterId === attackerId);
  const messageType = isPlayerAttack ? 'combat-player' : 'combat-enemy';

  await enqueueAttackAnimation(async () => {
    await playAttackAnimationFromUpdate(data);
  });

  let message = '';
  const damageAmount = typeof damage === 'number' ? damage : (damageDetail?.total ?? 0);

  if (critical) {
    message = `🎯 CRÍTICO! ${attackerName || 'Alguém'} acerta ${targetName || 'o alvo'}`;
    message += damageAmount ? ` causando ${damageAmount} de dano!` : '!';
  } else if (criticalFail) {
    message = `💥 FALHA CRÍTICA! ${attackerName || 'Alguém'} se machuca`;
    message += criticalFailDamage ? ` causando ${criticalFailDamage} de dano a si mesmo!` : '!';
  } else if (hit) {
    message = `⚔️ ${attackerName || 'Alguém'} ataca ${targetName || 'o alvo'}`;
    message += damageAmount ? ` causando ${damageAmount} de dano!` : '!';
  } else {
    message = `❌ ${attackerName || 'Alguém'} erra o ataque em ${targetName || 'o alvo'}!`;
  }

  appendChatMessage({
    type: messageType,
    content: message,
    timestamp: new Date().toISOString()
  });

  await refreshCombatState({ render: true });

  if (combatEnded) {
    const winMessage = winningSide === 'PLAYERS' ? '🎉 O grupo venceu o combate!' : '☠️ Os inimigos dominaram o combate.';
    appendChatMessage({
      type: 'combat-system',
      content: winMessage,
      timestamp: new Date().toISOString()
    });
    showNotification(winMessage, winningSide === 'PLAYERS' ? 'success' : 'error');
    handleCombatEnded(true, data);
  }
}

async function handleTurnSkippedUpdate(data = {}) {
  const { characterName, healAmount, nextTurn } = data;
  const baseName = characterName || 'Um combatente';
  const healText = healAmount ? ` e recuperou ${healAmount} ponto${healAmount === 1 ? '' : 's'} de vida` : '';
  const message = `💨 ${baseName} pulou o turno${healText}.`;

  appendChatMessage({
    type: 'combat-system',
    content: message,
    timestamp: new Date().toISOString()
  });

  if (nextTurn?.entityName) {
    appendChatMessage({
      type: 'combat-system',
      content: `➡️ Próximo turno: ${nextTurn.entityName}.`,
      timestamp: new Date().toISOString()
    });
  }

  await refreshCombatState({ render: true });
}

function handleCombatEnded(fromUpdate = false, data = {}) {
  clearInitiativeIntervals();
  const overlay = document.getElementById('combatInitiativeOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  combatInitiativeOverlayVisible = false;

  if (combatState) {
    combatState.isActive = false;
  }

  if (fromUpdate && data?.winningSide) {
    const winMessage = data.winningSide === 'PLAYERS' ? 'Vitória do grupo!' : 'Os inimigos venceram o combate.';
    addCombatLogEntry(winMessage);
  }

  renderCombatView();
}
