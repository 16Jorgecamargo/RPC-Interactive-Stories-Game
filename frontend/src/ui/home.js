import RpcClient from '../rpc/client.js';
import { getToken } from '../utils/auth.js';

const rpcClient = new RpcClient();
const SESSIONS_PER_PAGE = 6;
let currentPage = 1;
let allSessions = [];

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

    return {
      user: meResponse.user || meResponse,
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
    renderSessionsPage(currentPage);
  } else if (noSessionsElement) {
    noSessionsElement.style.display = 'block';
    const sessionsListElement = document.getElementById('sessionsList');
    if (sessionsListElement) {
      sessionsListElement.innerHTML = '';
    }
  }
}

function renderSessionsPage(page) {
  const sessionsListElement = document.getElementById('sessionsList');
  const paginationElement = document.getElementById('pagination');
  
  if (!sessionsListElement) return;

  const totalPages = Math.ceil(allSessions.length / SESSIONS_PER_PAGE);
  const startIndex = (page - 1) * SESSIONS_PER_PAGE;
  const endIndex = startIndex + SESSIONS_PER_PAGE;
  const sessionsToShow = allSessions.slice(startIndex, endIndex);

  sessionsListElement.innerHTML = sessionsToShow
    .map(
      (session) => `
    <div class="session-card" data-session-id="${session.id}">
      <div class="session-card-inner">
        <div class="session-card-front">
          <div class="session-card-header">
            <h3>${session.name}</h3>
            <span class="session-badge session-badge-${session.status.toLowerCase()}">${getStatusLabel(session.status)}</span>
          </div>
          <div class="session-card-front-content">
            <div class="session-icon">🎮</div>
            <p class="session-hint">Passe o mouse para ver detalhes</p>
          </div>
        </div>
        <div class="session-card-back">
          <div class="session-card-back-header">
            <h3 class="session-name">${session.name}</h3>
            <div class="session-code-badge">
              <span class="code-label">Código</span>
              <code>${session.sessionCode}</code>
            </div>
          </div>
          <div class="session-card-body">
            <div class="info-row">
              <span class="info-icon">📖</span>
              <div class="info-content">
                <span class="info-label">História</span>
                <span class="info-value">${session.storyTitle}</span>
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
          </div>
          <div class="session-card-actions">
            ${getActionButton(session)}
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join('');

  if (paginationElement && totalPages > 1) {
    paginationElement.style.display = 'flex';
    paginationElement.innerHTML = `
      <button class="pagination-btn" id="prevPage" ${page === 1 ? 'disabled' : ''}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="pagination-info">Página ${page} de ${totalPages}</span>
      <button class="pagination-btn" id="nextPage" ${page === totalPages ? 'disabled' : ''}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    `;

    attachPaginationListeners();
  } else if (paginationElement) {
    paginationElement.style.display = 'none';
  }

  attachSessionCardListeners();
}

function attachPaginationListeners() {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderSessionsPage(currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allSessions.length / SESSIONS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderSessionsPage(currentPage);
      }
    });
  }
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
  switch (session.status) {
    case 'WAITING_PLAYERS':
      return `<button class="btn btn-primary session-enter-btn" data-session-id="${session.id}">Entrar na Sala</button>`;
    case 'CREATING_CHARACTERS':
      return `<button class="btn btn-primary session-enter-btn" data-session-id="${session.id}">Criar Personagem</button>`;
    case 'IN_PROGRESS':
      return `<button class="btn btn-success session-enter-btn" data-session-id="${session.id}">Continuar</button>`;
    case 'COMPLETED':
      return `<button class="btn btn-secondary" disabled>Finalizada</button>`;
    default:
      return '';
  }
}

function attachSessionCardListeners() {
  const enterButtons = document.querySelectorAll('.session-enter-btn');
  enterButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const sessionId = e.target.dataset.sessionId;
      await handleEnterSession(sessionId);
    });
  });
}

async function handleEnterSession(sessionId) {
  console.log('Entrando na sessão:', sessionId);
  alert('Funcionalidade será implementada nas próximas sprints!');
}
