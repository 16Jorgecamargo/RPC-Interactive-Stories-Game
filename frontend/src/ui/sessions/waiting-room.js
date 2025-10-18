import { getToken, requireAuth } from '../../utils/auth.js';
import { getSessionDetails, startSession } from '../../services/sessionService.js';
import { sendRoomMessage, getRoomMessages } from '../../services/chatService.js';
import { handleError, showNotification, escapeHtml } from '../shared/utils.js';
import tabManager from '../../utils/tabManager.js';
import { showTabBlockedModal, hideTabBlockedModal } from '../shared/tabBlockedModal.js';
import { unifiedPolling } from '../../services/unifiedPollingService.js';
import { enterRoom } from '../../services/roomService.js';

requireAuth();

let sessionData = null;
let currentUserId = null;
let currentCharacterId = null;
let loadedMessageIds = new Set(); 
let kickTargetUserId = null; 

document.addEventListener('DOMContentLoaded', async () => {
  tabManager.init(
    () => {
      console.log('[WAITING ROOM] Aba bloqueada - outra aba assumiu controle');
      showTabBlockedModal();
      unifiedPolling.stopAll();
    },
    () => {
      console.log('[WAITING ROOM] Aba desbloqueada - reassumindo controle');
      hideTabBlockedModal();
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      if (sessionId) {
        startUnifiedPolling(sessionId);
      }
    }
  );

  if (!tabManager.isLeaderTab()) {
    console.log('[WAITING ROOM] Aba não é líder, aguardando...');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  if (!sessionId) {
    showNotification('ID da sessão não encontrado', 'error');
    setTimeout(() => window.location.href = '/home.html', 2000);
    return;
  }

  await loadSessionData(sessionId);
  setupEventListeners();
  startUnifiedPolling(sessionId);
});

async function loadSessionData(sessionId) {
  try {
    const token = getToken();
    const response = await getSessionDetails(sessionId, token);

    sessionData = response.session;

    const RpcClient = (await import('../../rpc/client.js')).default;
    const client = new RpcClient();
    const meResponse = await client.call('me', { token });
    currentUserId = meResponse.user ? meResponse.user.id : meResponse.id;

    const currentParticipant = sessionData.participants.find(p => p.userId === currentUserId);
    currentCharacterId = currentParticipant ? currentParticipant.characterId : null;

    if (response.story) {
      sessionData.storyName = response.story.title;
    }

    renderSessionInfo();
    renderParticipants();
    renderEmptySlots();
    checkOwnerControls();
    await loadChatMessages(sessionId);

    // Marca presença na sala (envia evento PLAYER_ROOM_JOINED)
    try {
      await enterRoom(sessionId, token);
      console.log('[WAITING ROOM] Presença marcada na sala');
    } catch (error) {
      console.error('[WAITING ROOM] Erro ao marcar presença:', error);
    }
  } catch (error) {
    handleError(error);
    setTimeout(() => window.location.href = '/home.html', 2000);
  }
}

function renderSessionInfo() {
  const storyNameEl = document.getElementById('storyName');
  const sessionInfoEl = document.getElementById('sessionInfo');

  if (sessionData.storyName) {
    storyNameEl.textContent = `🏰 ${sessionData.storyName}`;
  }
  sessionInfoEl.textContent = `Sala de Espera • ${sessionData.name}`;
}

function renderParticipants() {
  const participantsListEl = document.getElementById('participantsList');
  participantsListEl.innerHTML = '';

  sessionData.participants.forEach(participant => {
    const isOwner = participant.userId === sessionData.ownerId;
    const isCurrentUser = participant.userId === currentUserId;
    const hasCharacter = participant.hasCreatedCharacter;

    const participantCard = document.createElement('div');
    participantCard.className = 'card participant-card';

    if (isOwner) {
      participantCard.classList.add('owner');
    } else if (isCurrentUser) {
      participantCard.classList.add('current-user');
    }

    // Adiciona classe .offline se o participante não está online
    if (!participant.isOnline) {
      participantCard.classList.add('offline');
    }

    let statusIcon = '';
    let statusText = '';
    
    if (!hasCharacter) {
      statusIcon = '❌';
      statusText = 'Personagem não criado';
    } else if (participant.isOnline) {
      statusIcon = '✓';
      statusText = 'Personagem Pronto';
    } else {
      statusIcon = '⏸';
      statusText = 'Offline';
    }

    const username = participant.username || 'Jogador';
    const displayName = isCurrentUser 
      ? `Você (${username})` 
      : username;

    const ownerBadge = isOwner ? '👑 ' : '';
    const characterName = participant.characterName || 'Sem personagem';

    participantCard.innerHTML = `
      <div class="flex flex-between">
        <div>
          <h3 style="margin-bottom: 5px;">${ownerBadge}${escapeHtml(displayName)}</h3>
          <p style="font-size: 0.9rem; margin-bottom: 10px;">${escapeHtml(characterName)}</p>
        </div>
        <div class="text-center">
          <div class="status-badge" style="font-size: 1.5rem;">${statusIcon}</div>
          <small>${statusText}</small>
        </div>
      </div>
      <div class="flex" style="gap: 10px; margin-top: 10px;">
        ${renderParticipantActions(participant, isCurrentUser, isOwner, hasCharacter)}
      </div>
    `;

    participantsListEl.appendChild(participantCard);
  });
}

function renderParticipantActions(participant, isCurrentUser, isOwner, hasCharacter) {
  let buttons = '';

  if (isCurrentUser) {
    if (!hasCharacter) {
      buttons += `<button class="btn" onclick="createCharacter()" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">✨ Criar Personagem</button>`;
    } else {
      buttons += `<button class="btn btn-secondary" onclick="viewCharacter('${participant.characterId}')" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">📋 Meu Personagem</button>`;
    }
  } else {
    if (hasCharacter) {
      buttons += `<button class="btn btn-secondary" onclick="viewCharacter('${participant.characterId}')" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">📋 Ver Personagem</button>`;
    } else {
      buttons += `<button class="btn btn-secondary" disabled style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">📋 Ver Personagem</button>`;
    }

    // [ ]: Implementar método kickParticipant no backend
    // Se é o dono da sessão e não é o próprio participante
    // if (currentUserId === sessionData.ownerId && !isCurrentUser) {
    //   buttons += `<button class="btn btn-danger" onclick="openKickDialog('${participant.userId}', '${escapeHtml(participant.username)}')" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">🚫 Expulsar</button>`;
    // }
  }

  return buttons;
}

function renderEmptySlots() {
  const emptySlotsEl = document.getElementById('emptySlots');
  const slotsCountEl = document.getElementById('slotsCount');

  const currentPlayers = sessionData.participants.length;
  const emptySlots = sessionData.maxPlayers - currentPlayers;

  if (emptySlots > 0) {
    emptySlotsEl.style.display = 'block';
    slotsCountEl.textContent = `${emptySlots} ${emptySlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}`;
  } else {
    emptySlotsEl.style.display = 'none';
  }
}

function checkOwnerControls() {
  const ownerControlsEl = document.getElementById('ownerControls');
  
  if (currentUserId === sessionData.ownerId) {
    ownerControlsEl.style.display = 'block';
  } else {
    ownerControlsEl.style.display = 'none';
  }
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
      console.log('[CHAT] Mensagens recentes da sala carregadas:', response.messages.length);
    } else {
      console.log('[CHAT] Nenhuma mensagem recente na sala (últimos 5 min)');
    }
  } catch (error) {
    console.error('[CHAT] Erro ao carregar mensagens da sala:', error);
  }
}

function appendChatMessage(message) {
  const chatMessagesEl = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  
  const isCurrentUser = message.userId === currentUserId;
  const isSystem = message.type === 'SYSTEM' || message.type === 'system' || message.userId === 'system';
  
  let messageClass = 'chat-message';
  if (isSystem) {
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

  const senderName = isSystem 
    ? 'ℹ️ Sistema' 
    : isCurrentUser 
      ? 'Você' 
      : message.characterName || message.username || 'Jogador';

  const messageText = message.message || '';

  messageDiv.className = messageClass;
  messageDiv.innerHTML = `
    <strong>${escapeHtml(senderName)}:</strong> ${escapeHtml(messageText)}
    <span class="timestamp">${timestamp}</span>
  `;

  chatMessagesEl.appendChild(messageDiv);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function sendChatMessage() {
  const messageInputEl = document.getElementById('messageInput');
  const message = messageInputEl.value.trim();

  if (!message) return;

  try {
    const token = getToken();

    // Limpa o input imediatamente para melhor UX
    messageInputEl.value = '';

    // Envia mensagem para a sala (não persiste, apenas broadcast)
    await sendRoomMessage(sessionData.id, message, token);

    // Não exibe mensagem temporária - aguarda broadcast do backend
    // Isso evita duplicatas e garante que todos vejam a mesma mensagem
  } catch (error) {
    showNotification('Erro ao enviar mensagem: ' + error.message, 'error');
    // Restaura mensagem no input se houver erro
    messageInputEl.value = message;
  }
}

window.handleEnter = function(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
};

window.createCharacter = function() {
  window.location.href = `/character-form.html?sessionId=${sessionData.id}`;
};

window.viewCharacter = async function(characterId) {
  showNotification('Funcionalidade de visualizar personagem em desenvolvimento', 'info');
};

window.openKickDialog = function(userId, username) {
  kickTargetUserId = userId;
  document.getElementById('kickPlayerName').textContent = username;
  document.getElementById('kickDialog').style.display = 'flex';
};

window.closeKickDialog = function() {
  kickTargetUserId = null;
  document.getElementById('kickDialog').style.display = 'none';
};

// [ ]: Implementar método kickParticipant no backend
// Confirmar expulsão
// async function confirmKick() {
//   if (!kickTargetUserId) return;

//   try {
//     const token = getToken();
//     await kickParticipant(sessionData.id, kickTargetUserId, token);
//     showNotification('Jogador expulso com sucesso', 'success');
//     closeKickDialog();
//     await loadSessionData(sessionData.id);
//   } catch (error) {
//     showNotification('Erro ao expulsar jogador: ' + error.message, 'error');
//   }
// }

async function handleLeave() {
  try {
    const token = getToken();
    const { leaveRoom } = await import('../../services/roomService.js');
    
    // Chama leaveRoom para enviar evento PLAYER_ROOM_LEFT
    await leaveRoom(sessionData.id, token);
    
    // Aguarda 300ms para garantir que o evento foi processado pelo servidor
    // e que outros usuários receberão a mensagem de chat
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Para todos os pollers antes de sair
    unifiedPolling.stopAll();
    
    // Redireciona para home
    window.location.href = '/home.html';
  } catch (error) {
    console.error('Erro ao sair da sala:', error);
    // Para os pollers e redireciona mesmo se houver erro
    unifiedPolling.stopAll();
    window.location.href = '/home.html';
  }
}

async function handleStartSession() {
  const allHaveCharacters = sessionData.participants.every(p => p.hasCreatedCharacter);
  
  if (!allHaveCharacters) {
    showNotification('Todos os jogadores precisam criar seus personagens antes de iniciar', 'warning');
    return;
  }

  if (!confirm('Iniciar a aventura agora? Todos os jogadores serão redirecionados para o jogo.')) return;

  try {
    const token = getToken();
    await startSession(sessionData.id, token);
    showNotification('Iniciando aventura...', 'success');
    setTimeout(() => window.location.href = `/game.html?sessionId=${sessionData.id}`, 1000);
  } catch (error) {
    showNotification('Erro ao iniciar sessão: ' + error.message, 'error');
  }
}

/**
 * Inicia o sistema unificado de polling para a sala de espera
 * Gerencia: chat, sessão, heartbeat simultaneamente
 */
function startUnifiedPolling(sessionId) {
  console.log('[UNIFIED POLLING] Iniciando pollers para sessão (chat via broadcast):', sessionId);

  // Polling de atualizações da sessão (2s) - responsividade em tempo real
  // Inclui CHAT_MESSAGE, PLAYER_ROOM_JOINED/LEFT para presença instantânea
  unifiedPolling.startSessionPolling(sessionId, (update) => {
    console.log('[SESSION UPDATE]', update.type, update.data);

    switch (update.type) {
      case 'CHAT_MESSAGE':
        // Broadcast de mensagem de chat (não persiste)
        const msg = update.data;
        if (!loadedMessageIds.has(msg.id)) {
          loadedMessageIds.add(msg.id);
          appendChatMessage(msg);
        }
        break;

      case 'PLAYER_SESSION_JOINED':
        // Jogador entrou na sessão (join permanente)
        refreshSessionData(sessionId);
        break;

      case 'PLAYER_SESSION_LEFT':
        // Jogador saiu da sessão (leave permanente)
        refreshSessionData(sessionId);
        break;

      case 'PLAYER_ROOM_JOINED':
        // Jogador entrou na sala de espera (mensagem já aparece no chat)
        refreshSessionData(sessionId);
        break;

      case 'PLAYER_ROOM_LEFT':
        // Jogador saiu da sala de espera (mensagem já aparece no chat)
        refreshSessionData(sessionId);
        break;
        
      case 'CHARACTER_CREATED':
        showNotification(`${update.data.characterName} foi criado!`, 'success');
        refreshSessionData(sessionId);
        break;
        
      case 'CHARACTER_UPDATED':
        showNotification(`${update.data.characterName} foi atualizado`, 'info');
        refreshSessionData(sessionId);
        break;
        
      case 'ALL_CHARACTERS_READY':
        showNotification('Todos os personagens estão prontos!', 'success');
        break;
        
      case 'SESSION_STATE_CHANGED':
        handleSessionStateChange(update.data.newState, sessionId);
        break;
        
      case 'GAME_STARTED':
        showNotification('A aventura está começando!', 'success');
        setTimeout(() => window.location.href = `/game.html?sessionId=${sessionId}`, 1500);
        break;
        
      case 'SESSION_DELETED':
        showNotification('A sessão foi encerrada pelo mestre', 'error');
        setTimeout(() => window.location.href = '/home.html', 2000);
        break;
    }
  }, 2000); // 2s para responsividade em tempo real

  // Heartbeat para manter status online (15s - equilibra detecção de offline e carga)
  // Backend marca offline após 60s sem heartbeat, então 15s garante 4 tentativas
  unifiedPolling.startHeartbeat(sessionId, 15000);

  console.log('[UNIFIED POLLING] Pollers iniciados (chat via broadcast, polling 2s):', unifiedPolling.getStats());
}

/**
 * Atualiza dados da sessão e re-renderiza interface
 */
async function refreshSessionData(sessionId) {
  try {
    const token = getToken();
    const response = await getSessionDetails(sessionId, token);
    
    const oldParticipantsCount = sessionData?.participants?.length || 0;
    const newParticipantsCount = response.session.participants.length;
    
    sessionData = response.session;
    
    // Re-renderizar se houve mudanças
    if (oldParticipantsCount !== newParticipantsCount) {
      renderParticipants();
      renderEmptySlots();
      checkOwnerControls();
    } else {
      // Apenas atualizar status online se necessário
      renderParticipants();
    }
  } catch (error) {
    console.error('Erro ao atualizar dados da sessão:', error);
  }
}

/**
 * Trata mudanças de estado da sessão
 */
function handleSessionStateChange(newState, sessionId) {
  switch (newState) {
    case 'CREATING_CHARACTERS':
      showNotification('Fase de criação de personagens iniciada!', 'info');
      refreshSessionData(sessionId);
      break;
      
    case 'IN_PROGRESS':
      showNotification('A aventura está começando!', 'success');
      setTimeout(() => window.location.href = `/game.html?sessionId=${sessionId}`, 1500);
      break;
      
    case 'COMPLETED':
      showNotification('A sessão foi concluída!', 'info');
      setTimeout(() => window.location.href = '/home.html', 3000);
      break;
  }
}

function setupEventListeners() {
  document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
  document.getElementById('leaveBtn').addEventListener('click', handleLeave);
  
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', handleStartSession);
  }

  // [ ]: Descomentar quando kickParticipant estiver implementado no backend
  // const confirmKickBtn = document.getElementById('confirmKickBtn');
  // if (confirmKickBtn) {
  //   confirmKickBtn.addEventListener('click', confirmKick);
  // }
}

window.closeCharacterDialog = function() {
  document.getElementById('characterDialog').style.display = 'none';
};

window.addEventListener('beforeunload', () => {
  unifiedPolling.stopAll();
});
