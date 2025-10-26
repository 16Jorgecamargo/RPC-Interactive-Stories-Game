import RpcClient from '../rpc/client.js';
import { getToken } from '../utils/auth.js';
import { dialogManager } from './dialogs/index.js';
import tabManager from '../utils/tabManager.js';
import { showTabBlockedModal, hideTabBlockedModal } from './shared/tabBlockedModal.js';
import { unifiedPolling } from '../services/unifiedPollingService.js';

const rpcClient = new RpcClient();
let allSessions = [];
let currentUserId = null;

export async function loadHome() {
  const token = getToken();

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const [meResponse, sessionsResponse] = await Promise.all([
      rpcClient.call('me', { token }),
      rpcClient.call('listMySessions', { token }),
    ]);

    allSessions = sessionsResponse.sessions || [];
    const user = meResponse.user || meResponse;
    currentUserId = user.id;

    return {
      user,
      sessions: allSessions,
      total: sessionsResponse.total || 0,
      hasSessions: allSessions.length > 0,
    };
  } catch (error) {
    console.error('Erro ao carregar home:', error);
    throw error;
  }
}

export function renderHomeData(data) {
  const usernameElement = document.getElementById('username');
  const noSessionsElement = document.getElementById('noSessions');

  if (usernameElement) {
    usernameElement.textContent = data.user.username;
  }

  if (data.hasSessions) {
    noSessionsElement.style.display = 'none';
    renderAllSessions();
  } else if (noSessionsElement) {
    noSessionsElement.style.display = 'block';
    const sessionsListElement = document.getElementById('sessionsList');
    if (sessionsListElement) {
      sessionsListElement.innerHTML = '';
    }
  }
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function copyToClipboard(text, buttonElement) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '✓ Copiado!';
    buttonElement.style.background = 'linear-gradient(145deg, #228B22, #1E7B1E)';

    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.style.background = '';
    }, 2000);
  } catch (error) {
    console.error('Erro ao copiar:', error);
    dialogManager.showError({
      title: '❌ Erro ao Copiar',
      message: 'Não foi possível copiar o código. Tente novamente.',
    });
  }
}

async function handleDeleteSession(sessionId, sessionName) {
  dialogManager.showError({
    title: '⚠️ Confirmar Exclusão',
    message: `Tem certeza que deseja excluir a sessão "<strong>${sessionName}</strong>"?<br><br>Esta ação não pode ser desfeita.`,
    showRetry: true,
    retryText: '🗑️ Apagar Sessão',
    retryCallback: async () => {
      try {
        const token = getToken();
        await rpcClient.call('deleteSession', { token, sessionId });

        dialogManager.showSuccess({
          title: '🗑️ Sessão Excluída',
          message: 'A sessão foi excluída com sucesso.',
          closeCallback: () => {
            window.location.reload();
          },
        });
      } catch (error) {
        console.error('Erro ao excluir sessão:', error);
        dialogManager.showError({
          title: '❌ Erro ao Excluir',
          message: error.message || 'Não foi possível excluir a sessão. Tente novamente.',
        });
      }
    },
  });
}

async function handleLeaveSession(sessionId, sessionName) {
  dialogManager.showError({
    title: '⚠️ Confirmar Saída',
    message: `Tem certeza que deseja sair da sessão "<strong>${sessionName}</strong>"?`,
    showRetry: true,
    retryText: '🚪 Sair da Sessão',
    retryCallback: async () => {
      try {
        const token = getToken();
        await rpcClient.call('leaveSession', { token, sessionId });

        dialogManager.showSuccess({
          title: '🚪 Saída Confirmada',
          message: 'Você saiu da sessão com sucesso.',
          closeCallback: () => {
            window.location.reload();
          },
        });
      } catch (error) {
        console.error('Erro ao sair da sessão:', error);
        dialogManager.showError({
          title: '❌ Erro ao Sair',
          message: error.message || 'Não foi possível sair da sessão. Tente novamente.',
        });
      }
    },
  });
}

function showStoryInfoDialog(session) {
  dialogManager.showStoryInfo({
    storyTitle: session.storyTitle,
    storyGenre: session.storyGenre,
    storySynopsis: session.storySynopsis || 'Sinopse não disponível.',
  });
}

function renderAllSessions() {
  const sessionsListElement = document.getElementById('sessionsList');

  if (!sessionsListElement) return;

  sessionsListElement.innerHTML = allSessions
    .map((session) => {
      const characterInfo = session.myCharacterName
        ? `<div class="info-row">
              <span class="info-icon">🎮</span>
              <div class="info-content">
                <span class="info-label">Seu Personagem</span>
                <span class="info-value">${session.myCharacterName}</span>
              </div>
            </div>`
        : '<div class="info-row"><span class="info-icon">🎮</span><div class="info-content"><span class="info-label">Seu Personagem</span><span class="info-value" style="color: #C0C0C0; font-style: italic;">Não criado</span></div></div>';

      const lastActivity = session.updatedAt
        ? formatRelativeDate(session.updatedAt)
        : 'Desconhecida';

      return `
        <div class="session-card" data-session-id="${session.id}">
          <div class="session-card-header">
            <h3 class="session-name">${session.name}</h3>
          </div>

          <div class="session-card-body">
            <div class="session-story-row">
              <div class="story-info story-info-clickable" data-session-idx="${allSessions.indexOf(session)}" title="Clique para ver a sinopse">
                <span class="info-icon">📖</span>
                <span class="story-title">${session.storyTitle}</span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-icon">📋</span>
                <div class="info-content">
                  <span class="info-label">Código</span>
                  <code class="info-value session-code-clickable" data-code="${session.sessionCode}" style="cursor: pointer; font-family: 'Courier New', monospace; letter-spacing: 1px; font-weight: 800;">${session.sessionCode}</code>
                </div>
              </div>

              <div class="info-row">
                <span class="info-icon">👤</span>
                <div class="info-content">
                  <span class="info-label">Dono</span>
                  <span class="info-value">${session.ownerUsername || 'Desconhecido'}</span>
                </div>
              </div>

              <div class="info-row">
                <span class="info-icon">🎭</span>
                <div class="info-content">
                  <span class="info-label">Gênero</span>
                  <span class="info-value">${session.storyGenre}</span>
                </div>
              </div>

              <div class="info-row">
                <span class="info-icon">👥</span>
                <div class="info-content">
                  <span class="info-label">Jogadores</span>
                  <span class="info-value">${session.participants.length}/${session.maxPlayers}</span>
                </div>
              </div>

              ${characterInfo}

              <div class="info-row">
                <span class="info-icon">📅</span>
                <div class="info-content">
                  <span class="info-label">Criada</span>
                  <span class="info-value">${formatRelativeDate(session.createdAt)}</span>
                </div>
              </div>

              <div class="info-row">
                <span class="info-icon">⏰</span>
                <div class="info-content">
                  <span class="info-label">Última Atividade</span>
                  <span class="info-value">${lastActivity}</span>
                </div>
              </div>

              <div class="info-row">
                <span class="info-icon">📊</span>
                <div class="info-content">
                  <span class="info-label">Status</span>
                  <span class="info-value">${getStatusLabel(session.status)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="session-card-actions">
            ${getActionButton(session)}
          </div>
        </div>
      `;
    })
    .join('');

  attachSessionCardListeners();
}

function getStatusLabel(status) {
  const labels = {
    WAITING_PLAYERS: 'Aguardando',
    CREATING_CHARACTERS: 'Criando',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
  };
  return labels[status] || status;
}

function getActionButton(session) {
  const isOwner = session.ownerId === currentUserId;
  const isCompleted = session.status === 'COMPLETED';

  let enterButtonText = '';
  let enterButtonClass = 'btn-primary';
  
  switch (session.status) {
    case 'WAITING_PLAYERS':
      enterButtonText = 'Entrar na Sala';
      break;
    case 'CREATING_CHARACTERS':
      enterButtonText = 'Criar Personagem';
      break;
    case 'IN_PROGRESS':
      enterButtonText = 'Continuar';
      enterButtonClass = 'btn-success';
      break;
    case 'COMPLETED':
      enterButtonText = 'Finalizada';
      enterButtonClass = 'btn-secondary';
      break;
    default:
      enterButtonText = '';
  }

  if (isCompleted) {
    return `<button class="btn ${enterButtonClass}" disabled>${enterButtonText}</button>`;
  }

  const leaveButton = !isOwner
    ? `
      <button class="btn btn-danger session-leave-btn" data-session-id="${session.id}" data-session-name="${session.name}">
        <span>Sair da Sessão</span>
        <div class="icon">🚪</div>
      </button>
    `
    : '';

  const deleteButton = isOwner
    ? `
      <button class="btn btn-danger session-delete-btn" data-session-id="${session.id}" data-session-name="${session.name}">
        <span>Apagar Sessão</span>
        <div class="icon">🗑️</div>
      </button>
    `
    : '';

  const actionButton = isOwner ? deleteButton : leaveButton;

  return `
    <div class="session-actions-group">
      <button class="btn ${enterButtonClass} session-enter-btn" data-session-id="${session.id}">${enterButtonText}</button>
      ${actionButton}
    </div>
  `;
}

function attachSessionCardListeners() {
  const enterButtons = document.querySelectorAll('.session-enter-btn');
  enterButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const sessionId = e.target.dataset.sessionId;
      await handleEnterSession(sessionId);
    });
  });

  const sessionCodes = document.querySelectorAll('.session-code-clickable');
  sessionCodes.forEach((codeElement) => {
    codeElement.addEventListener('click', async (e) => {
      e.stopPropagation();
      const code = e.target.dataset.code;

      try {
        await navigator.clipboard.writeText(code);
        const originalText = codeElement.textContent;
        const originalColor = codeElement.style.color;

        codeElement.textContent = '✓ Copiado!';
        codeElement.style.color = '#228B22';

        setTimeout(() => {
          codeElement.textContent = originalText;
          codeElement.style.color = originalColor;
        }, 1500);
      } catch (error) {
        console.error('Erro ao copiar código:', error);
        dialogManager.showError({
          title: '❌ Erro ao Copiar',
          message: 'Não foi possível copiar o código. Tente novamente.',
        });
      }
    });

    codeElement.addEventListener('mouseenter', () => {
      codeElement.style.textDecoration = 'underline';
    });
    codeElement.addEventListener('mouseleave', () => {
      codeElement.style.textDecoration = 'none';
    });
  });

  const deleteButtons = document.querySelectorAll('.session-delete-btn');
  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sessionId = btn.dataset.sessionId;
      const sessionName = btn.dataset.sessionName;
      await handleDeleteSession(sessionId, sessionName);
    });
  });

  const leaveButtons = document.querySelectorAll('.session-leave-btn');
  leaveButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sessionId = btn.dataset.sessionId;
      const sessionName = btn.dataset.sessionName;
      await handleLeaveSession(sessionId, sessionName);
    });
  });

  const storyInfoElements = document.querySelectorAll('.story-info-clickable');
  storyInfoElements.forEach((element) => {
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      const sessionIdx = parseInt(element.dataset.sessionIdx);
      const session = allSessions[sessionIdx];
      if (session) {
        showStoryInfoDialog(session);
      }
    });

    element.addEventListener('mouseenter', () => {
      element.style.cursor = 'pointer';
      element.style.opacity = '0.8';
    });
    element.addEventListener('mouseleave', () => {
      element.style.opacity = '1';
    });
  });
}

async function handleEnterSession(sessionId) {
  const session = allSessions.find(s => s.id === sessionId);
  
  if (!session) {
    dialogManager.showError({
      title: '❌ Erro',
      message: 'Sessão não encontrada.',
    });
    return;
  }

  try {
    const token = getToken();
    
    switch (session.status) {
      case 'WAITING_PLAYERS':
      case 'CREATING_CHARACTERS':
        // Chama enterRoom antes de redirecionar para enviar evento PLAYER_ROOM_JOINED
        const { enterRoom } = await import('../services/roomService.js');
        await enterRoom(sessionId, token);
        
        window.location.href = `/waiting-room.html?sessionId=${sessionId}`;
        break;
      
      case 'IN_PROGRESS':
        window.location.href = `/gameplay.html?sessionId=${sessionId}`;
        break;
      
      case 'COMPLETED':
        dialogManager.showError({
          title: '✓ Sessão Finalizada',
          message: 'Esta sessão já foi concluída.',
        });
        break;
      
      default:
        console.log('Status desconhecido:', session.status);
        window.location.href = `/waiting-room.html?sessionId=${sessionId}`;
    }
  } catch (error) {
    console.error('Erro ao entrar na sessão:', error);
    dialogManager.showError({
      title: '❌ Erro',
      message: 'Não foi possível entrar na sessão. Tente novamente.',
    });
  }
}

/**
 * Inicia polling unificado para atualizar cards da home em tempo real
 * - Número de jogadores online
 * - Status das sessões
 * - Última atividade
 * - Novos personagens criados
 */
export function startHomePolling() {
  unifiedPolling.startHomePolling((update) => {
    if (update.type === 'SESSIONS_UPDATE') {
      const newSessions = update.data;
      
      // Verifica se houve mudanças relevantes
      const hasChanges = newSessions.some((newSession, index) => {
        const oldSession = allSessions[index];
        
        if (!oldSession) return true;
        
        return (
          oldSession.participants?.length !== newSession.participants?.length ||
          oldSession.onlineCount !== newSession.onlineCount ||
          oldSession.status !== newSession.status ||
          oldSession.updatedAt !== newSession.updatedAt
        );
      });
      
      if (hasChanges) {
        console.log('[HOME POLLING] Detectadas mudanças, atualizando interface...');
        allSessions = newSessions;
        renderAllSessions();
      }
    }
  }, 15000); // Polling a cada 15 segundos
  
  console.log('[HOME POLLING] Polling iniciado:', unifiedPolling.getStats());
}

/**
 * Para o polling da home (ao sair da página)
 */
export function stopHomePolling() {
  unifiedPolling.stopPoller('home_sessions');
  console.log('[HOME POLLING] Polling parado');
}

function initializeActionButtons() {
  const createSessionBtn = document.getElementById('createSessionBtn');
  const joinSessionBtn = document.getElementById('joinSessionBtn');

  if (createSessionBtn) {
    createSessionBtn.addEventListener('click', () => {
      window.location.href = '/session-create.html';
    });
  }

  if (joinSessionBtn) {
    joinSessionBtn.addEventListener('click', () => {
      dialogManager.showJoinSession();
    });
  }
}

// Inicializar botões
initializeActionButtons();

// Iniciar polling em tempo real
startHomePolling();

// Parar polling ao sair da página
window.addEventListener('beforeunload', () => {
  stopHomePolling();
});
