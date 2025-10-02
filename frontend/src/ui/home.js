import RpcClient from '../rpc/client.js';
import { getToken } from '../utils/auth.js';

const rpcClient = new RpcClient();

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

    return {
      user: meResponse.user || meResponse,
      sessions: sessionsResponse.sessions || [],
      total: sessionsResponse.total || 0,
      hasSessions: sessionsResponse.sessions && sessionsResponse.sessions.length > 0,
    };
  } catch (error) {
    console.error('Erro ao carregar home:', error);
    throw error;
  }
}

export function renderHomeData(data) {
  const usernameElement = document.getElementById('username');
  const sessionsListElement = document.getElementById('sessionsList');
  const noSessionsElement = document.getElementById('noSessions');

  if (usernameElement) {
    usernameElement.textContent = data.user.username;
  }

  if (data.hasSessions && sessionsListElement) {
    noSessionsElement.style.display = 'none';
    sessionsListElement.innerHTML = data.sessions
      .map(
        (session) => `
      <div class="session-card" data-session-id="${session.id}">
        <div class="session-card-header">
          <h3>${session.name}</h3>
          <span class="session-badge session-badge-${session.status.toLowerCase()}">${getStatusLabel(session.status)}</span>
        </div>
        <div class="session-card-body">
          <p class="session-story"><strong>História:</strong> ${session.storyTitle}</p>
          <p class="session-genre"><strong>Gênero:</strong> ${session.storyGenre}</p>
          <p class="session-players"><strong>Jogadores:</strong> ${session.participants.length}/${session.maxPlayers}</p>
          <p class="session-code"><strong>Código:</strong> <code>${session.sessionCode}</code></p>
        </div>
        <div class="session-card-actions">
          ${getActionButton(session)}
        </div>
      </div>
    `,
      )
      .join('');

    attachSessionCardListeners();
  } else if (noSessionsElement) {
    noSessionsElement.style.display = 'block';
    if (sessionsListElement) {
      sessionsListElement.innerHTML = '';
    }
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
