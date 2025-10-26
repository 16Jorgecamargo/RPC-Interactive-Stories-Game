import { getToken, requireAuth } from '../../utils/auth.js';
import { getSessionDetails, startSession, transitionToCreatingCharacters } from '../../services/sessionService.js';
import { sendRoomMessage, getRoomMessages } from '../../services/chatService.js';
import { handleError, showNotification, escapeHtml } from '../shared/utils.js';
import tabManager from '../../utils/tabManager.js';
import { showTabBlockedModal, hideTabBlockedModal } from '../shared/tabBlockedModal.js';
import { unifiedPolling } from '../../services/unifiedPollingService.js';
import { enterRoom } from '../../services/roomService.js';
import { getCharacter } from '../../services/characterService.js';

requireAuth();

let sessionData = null;
let currentUserId = null;
let currentCharacterId = null;
let loadedMessageIds = new Set(); 
let kickTargetUserId = null; 
const characterCache = new Map();
let characterDialogContext = {
  characterId: null,
  canEdit: false,
};
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
      buttons += `<button class="btn btn-secondary" onclick="viewCharacter('${participant.characterId}', true)" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">📋 Meu Personagem</button>`;
    }
  } else {
    if (hasCharacter) {
      buttons += `<button class="btn btn-secondary" onclick="viewCharacter('${participant.characterId}', false)" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">📋 Ver Personagem</button>`;
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
  const editBtn = document.getElementById('editCharacterBtn');

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

  if (editBtn) {
    if (characterDialogContext.canEdit) {
      editBtn.style.display = 'inline-flex';
      editBtn.disabled = true;
      editBtn.textContent = '✏️ Editar Personagem';
    } else {
      editBtn.style.display = 'none';
    }
  }

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
  const editBtn = document.getElementById('editCharacterBtn');

  if (editBtn) {
    if (characterDialogContext.canEdit) {
      editBtn.style.display = 'inline-flex';
      editBtn.disabled = false;
    } else {
      editBtn.style.display = 'none';
    }
  }

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

function handleEditCharacter() {
  if (!characterDialogContext.canEdit || !characterDialogContext.characterId) {
    return;
  }

  window.closeCharacterDialog();

  const params = new URLSearchParams();
  if (sessionData?.id) {
    params.set('sessionId', sessionData.id);
  }
  params.set('characterId', characterDialogContext.characterId);
  window.location.href = `/character-form.html?${params.toString()}`;
}

window.viewCharacter = async function(characterId, canEdit = false) {
  if (!characterId) {
    showNotification('Personagem não encontrado', 'error');
    return;
  }

  const isEditable = canEdit === true || canEdit === 'true';
  characterDialogContext = {
    characterId,
    canEdit: Boolean(isEditable),
  };

  showCharacterDialogLoading();

  try {
    const token = getToken();
    let character = characterCache.get(characterId);

    if (!character) {
      character = await getCharacter(characterId, token);
      characterCache.set(characterId, character);
    }

    populateCharacterDialog(character);
  } catch (error) {
    console.error('Erro ao visualizar personagem:', error);
    window.closeCharacterDialog();
    const message = error?.message || 'Não foi possível carregar o personagem';
    showNotification(message, 'error');
  }
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

    if (sessionData.status === 'WAITING_PLAYERS') {
      console.log('[START SESSION] Transicionando de WAITING_PLAYERS para CREATING_CHARACTERS');
      await transitionToCreatingCharacters(sessionData.id, token);
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshSessionData(sessionData.id);
    }

    if (sessionData.status === 'CREATING_CHARACTERS') {
      console.log('[START SESSION] Iniciando sessão (CREATING_CHARACTERS -> IN_PROGRESS)');
      await startSession(sessionData.id, token);
      showNotification('Iniciando aventura...', 'success');
      setTimeout(() => window.location.href = `/gameplay.html?sessionId=${sessionData.id}`, 1000);
    } else {
      showNotification('Sessão já foi iniciada', 'info');
    }
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
        setTimeout(() => window.location.href = `/gameplay.html?sessionId=${sessionId}`, 1500);
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
      setTimeout(() => window.location.href = `/gameplay.html?sessionId=${sessionId}`, 1500);
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

  const editCharacterBtn = document.getElementById('editCharacterBtn');
  if (editCharacterBtn) {
    editCharacterBtn.addEventListener('click', handleEditCharacter);
  }
}

window.closeCharacterDialog = function() {
  const dialog = document.getElementById('characterDialog');
  if (dialog) {
    dialog.style.display = 'none';
  }
  characterDialogContext = {
    characterId: null,
    canEdit: false,
  };
};

window.addEventListener('beforeunload', () => {
  unifiedPolling.stopAll();
});
