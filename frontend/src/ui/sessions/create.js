import RpcClient from '../../rpc/client.js';
import { getToken, requireAuth } from '../../utils/auth.js';
import { dialogManager } from '../shared/dialog.js';

requireAuth();

const client = new RpcClient();
const token = getToken();

const elements = {
  form: document.getElementById('sessionForm'),
  sessionName: document.getElementById('sessionName'),
  storyId: document.getElementById('storyId'),
  selectedStoryName: document.getElementById('selectedStoryName'),
  chooseStoryBtn: document.getElementById('chooseStoryBtn'),
  voteTime: document.getElementById('voteTime'),
  voteTimeDisplay: document.getElementById('voteTimeDisplay'),
  maxPlayers: document.getElementById('maxPlayers'),
  sessionSummary: document.getElementById('sessionSummary'),
  createBtn: document.getElementById('createBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  buttonText: document.getElementById('buttonText'),
  buttonLoader: document.getElementById('buttonLoader'),
  errorMessage: document.getElementById('errorMessage'),
};

function updateVoteTimeDisplay(value) {
  const seconds = parseInt(value);
  elements.voteTimeDisplay.textContent = `${seconds} segundo${seconds > 1 ? 's' : ''}`;
  updateSessionSummary();
}

function updateSessionSummary() {
  const sessionName = elements.sessionName.value.trim();
  const storyName = elements.selectedStoryName.textContent;
  const tiebreakerRadio = document.querySelector('input[name="tiebreaker"]:checked');
  const voteTime = elements.voteTime.value;
  const maxPlayers = elements.maxPlayers.value;

  let summary = '';

  if (sessionName) {
    summary += `🏰 <strong>${sessionName}</strong><br>`;
  }

  if (storyName && storyName !== 'Nenhuma história selecionada') {
    summary += `📖 ${storyName}<br>`;
  }

  if (tiebreakerRadio) {
    const tiebreakerLabel = tiebreakerRadio.parentElement.querySelector('.radio-text').textContent;
    summary += `⚔️ ${tiebreakerLabel}<br>`;
  }

  if (voteTime) {
    summary += `⏱️ ${voteTime} segundos para votação<br>`;
  }

  if (maxPlayers) {
    summary += `👥 Até ${maxPlayers} jogador${parseInt(maxPlayers) > 1 ? 'es' : ''}<br>`;
  }

  if (summary && sessionName) {
    elements.sessionSummary.innerHTML = summary;
  } else {
    elements.sessionSummary.innerHTML = 'Complete os campos acima para ver o resumo da sessão.';
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';

  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
    elements.errorMessage.textContent = '';
  }, 5000);
}

function setLoading(isLoading) {
  elements.createBtn.disabled = isLoading;
  elements.cancelBtn.disabled = isLoading;

  if (isLoading) {
    elements.buttonText.style.display = 'none';
    elements.buttonLoader.style.display = 'inline-block';
  } else {
    elements.buttonText.style.display = 'inline';
    elements.buttonLoader.style.display = 'none';
  }
}

function handleChooseStory() {
  console.log('Funcionalidade de catálogo de histórias será implementada em breve!');
}

async function handleSubmit(event) {
  event.preventDefault();

  const sessionName = elements.sessionName.value.trim();
  const storyId = elements.storyId.value;
  const tiebreakerRadio = document.querySelector('input[name="tiebreaker"]:checked');
  const tieResolutionStrategy = tiebreakerRadio ? tiebreakerRadio.value : 'RANDOM';
  const votingTimeoutSeconds = parseInt(elements.voteTime.value);
  const maxPlayers = parseInt(elements.maxPlayers.value);

  if (!sessionName || sessionName.length < 3 || sessionName.length > 100) {
    showError('O nome da sessão deve ter entre 3 e 100 caracteres.');
    return;
  }

  if (!storyId) {
    showError('Por favor, escolha uma história antes de criar a sessão.');
    return;
  }

  if (!tieResolutionStrategy) {
    showError('Por favor, selecione um modo de desempate.');
    return;
  }

  if (!votingTimeoutSeconds || votingTimeoutSeconds < 10 || votingTimeoutSeconds > 60) {
    showError('O tempo de votação deve estar entre 10 e 60 segundos.');
    return;
  }

  if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 10) {
    showError('O número de jogadores deve estar entre 2 e 10.');
    return;
  }

  setLoading(true);
  elements.errorMessage.style.display = 'none';

  try {
    const result = await client.call('createSession', {
      token,
      name: sessionName,
      storyId,
      maxPlayers,
      tieResolutionStrategy,
      votingTimeoutSeconds,
    });

    setLoading(false);

    if (result && result.session) {
      dialogManager.showSuccess({
        title: '🎉 Sessão Criada!',
        message: `
          <strong style="font-size: 1.3rem; color: #D4AF37;">${result.session.name}</strong><br><br>
          Código da Sessão: <strong style="font-size: 1.5rem; color: #D4AF37; letter-spacing: 3px;">${result.session.sessionCode}</strong><br><br>
          Compartilhe este código com seus amigos para que eles possam entrar na aventura!
        `,
        showConfetti: true,
        showContinue: true,
        continueText: '➡️ Ir para Sala de Espera',
        continueCallback: () => {
          window.location.href = `/waiting-room.html?sessionId=${result.session.id}`;
        },
        closeCallback: () => {
          window.location.href = '/home.html';
        },
      });
    } else {
      throw new Error('Resposta inválida do servidor');
    }
  } catch (error) {
    setLoading(false);
    console.error('Erro ao criar sessão:', error);

    let errorMessage = 'Não foi possível criar a sessão. Por favor, tente novamente.';

    if (error.message) {
      errorMessage = error.message;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    dialogManager.showError({
      title: '❌ Erro ao Criar Sessão',
      message: errorMessage,
      showRetry: true,
      retryCallback: () => {
        handleSubmit(event);
      },
    });
  }
}

function handleCancel() {
  window.location.href = '/home.html';
}

elements.form.addEventListener('submit', handleSubmit);
elements.cancelBtn.addEventListener('click', handleCancel);
elements.chooseStoryBtn.addEventListener('click', handleChooseStory);

elements.sessionName.addEventListener('input', updateSessionSummary);
elements.voteTime.addEventListener('input', (e) => {
  updateVoteTimeDisplay(e.target.value);
});
elements.maxPlayers.addEventListener('input', updateSessionSummary);

const tiebreakerRadios = document.querySelectorAll('input[name="tiebreaker"]');
tiebreakerRadios.forEach(radio => {
  radio.addEventListener('change', updateSessionSummary);
});

updateVoteTimeDisplay(elements.voteTime.value);
updateSessionSummary();
