import RpcClient from '../../rpc/client.js';
import { getToken } from '../../utils/auth.js';

const rpcClient = new RpcClient();

export function showJoinSession(manager, config = {}) {
  const defaults = {
    closeCallback: null,
  };

  const finalConfig = { ...defaults, ...config };

  const dialog = createJoinSessionDialog(manager, finalConfig);
  manager.showDialog(dialog);

  setTimeout(() => {
    const input = dialog.querySelector('#sessionCode');
    if (input) input.focus();
  }, 100);
}

export function createJoinSessionDialog(manager, config) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog fade-in';
  dialog.style.cssText = `
    max-width: 500px;
    width: 90%;
    background: linear-gradient(145deg, #3E2417, #5D4037);
    border: 2px solid #D4AF37;
    border-radius: 15px;
    padding: 30px;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;

  dialog.innerHTML = `
    <button class="dialog-close" style="position: absolute; top: 15px; right: 15px; background: rgba(139, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; z-index: 3; transition: all 0.3s;">✕</button>

    <div style="text-align: center; margin-bottom: 25px;">
      <h2 style="color: #D4AF37; margin: 0 0 10px 0; font-family: 'Cinzel Decorative', serif;">🗝️ Entrar em Sessão</h2>
      <p style="color: #C0C0C0; font-style: italic; margin: 0;">
        "Digite o código mágico para se juntar à aventura"
      </p>
    </div>

    <form id="joinSessionForm">
      <div class="input-group" style="margin-bottom: 20px;">
        <label for="sessionCode" style="display: block; color: #D4AF37; font-weight: 600; margin-bottom: 8px; font-family: 'Cinzel', serif;">📜 Código da Sessão</label>
        <input
          type="text"
          id="sessionCode"
          name="sessionCode"
          placeholder="ABC123"
          style="width: 100%; padding: 12px 15px; border: 2px solid #D4AF37; border-radius: 8px; background: rgba(244, 228, 188, 0.1); color: #F4E4BC; font-family: 'Cinzel', serif; font-size: 1.2rem; text-align: center; letter-spacing: 3px; font-weight: bold; text-transform: uppercase;"
          maxlength="6"
          autocomplete="off"
          required>
        <small style="color: #C0C0C0; font-size: 0.8rem; display: block; margin-top: 5px; text-align: center;">
          * Código alfanumérico de 6 caracteres
        </small>
      </div>

      <div id="sessionInfo" class="input-group" style="display: none; margin-bottom: 20px;">
        <div style="background: rgba(34, 139, 34, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #228B22;">
          <h4 style="margin: 0 0 10px 0; color: #228B22; font-family: 'Cinzel', serif;">✓ Sessão Encontrada!</h4>
          <div style="color: #F4E4BC; font-size: 0.9rem;">
            <p style="margin: 5px 0;"><strong>🏰 Nome:</strong> <span id="foundSessionName">-</span></p>
            <p style="margin: 5px 0;"><strong>📖 História:</strong> <span id="foundStoryName">-</span></p>
            <p style="margin: 5px 0;"><strong>👥 Jogadores:</strong> <span id="foundPlayerCount">-</span></p>
            <p style="margin: 5px 0;"><strong>🎭 Status:</strong> <span id="foundStatus">-</span></p>
          </div>
        </div>
      </div>

      <div id="errorInfo" class="input-group" style="display: none; margin-bottom: 20px;">
        <div style="background: rgba(139, 0, 0, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #8B0000;">
          <h4 style="margin: 0 0 10px 0; color: #8B0000; font-family: 'Cinzel', serif;">❌ Erro</h4>
          <div style="color: #F4E4BC; font-size: 0.9rem;">
            <p id="errorMessage" style="margin: 0;">-</p>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: center;">
        <button type="submit" id="joinBtn" class="btn" disabled style="font-family: 'Cinzel', serif; font-weight: 600; padding: 12px 30px; border: 2px solid #228B22; border-radius: 8px; background: linear-gradient(145deg, #228B22, #1E7B1E); color: white; cursor: pointer; transition: all 0.3s ease; opacity: 0.5;">
          🚪 Entrar
        </button>
      </div>
    </form>

    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #D4AF37; margin-top: 20px;">
      <p style="font-size: 0.9rem; color: #C0C0C0; font-style: italic; margin: 0;">
        🔮 "Alguns portais só se abrem para aqueles que possuem a chave certa..."
      </p>
    </div>
  `;

  const closeBtn = dialog.querySelector('.dialog-close');
  const form = dialog.querySelector('#joinSessionForm');
  const codeInput = dialog.querySelector('#sessionCode');
  const joinBtn = dialog.querySelector('#joinBtn');
  const sessionInfo = dialog.querySelector('#sessionInfo');
  const errorInfo = dialog.querySelector('#errorInfo');

  let currentSession = null;

  const closeAction = () => {
    manager.closeDialog();
    if (config.closeCallback) config.closeCallback();
  };

  closeBtn.addEventListener('click', closeAction);

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.transform = 'scale(1.1)';
    closeBtn.style.background = 'rgba(139, 0, 0, 1)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.transform = 'scale(1)';
    closeBtn.style.background = 'rgba(139, 0, 0, 0.8)';
  });

  joinBtn.addEventListener('mouseenter', () => {
    if (!joinBtn.disabled) {
      joinBtn.style.transform = 'translateY(-2px)';
      joinBtn.style.boxShadow = '0 4px 12px rgba(34, 139, 34, 0.4)';
    }
  });
  joinBtn.addEventListener('mouseleave', () => {
    joinBtn.style.transform = 'translateY(0)';
    joinBtn.style.boxShadow = 'none';
  });

  codeInput.addEventListener('input', (e) => {
    const code = e.target.value.toUpperCase();
    e.target.value = code;

    sessionInfo.style.display = 'none';
    errorInfo.style.display = 'none';
    joinBtn.disabled = true;
    joinBtn.style.opacity = '0.5';
    joinBtn.style.cursor = 'not-allowed';
    currentSession = null;

    if (code.length === 6) {
      searchSession();
    }
  });

  async function searchSession() {
    const code = codeInput.value.toUpperCase();

    if (code.length !== 6) {
      showError('Digite um código válido de 6 caracteres');
      return;
    }

    joinBtn.disabled = true;
    joinBtn.style.opacity = '0.5';
    joinBtn.style.cursor = 'not-allowed';
    joinBtn.innerHTML = '<span class="loading-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: #ffffff; animation: spin 1s linear infinite;"></span>';

    try {
      const token = getToken();
      const result = await rpcClient.call('joinSession', {
        token,
        sessionCode: code,
      });

      if (result && result.session) {
        currentSession = result.session;
        showSessionInfo(result.session);
      }
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      showError(error.message || 'Sessão não encontrada ou código inválido');
    }
  }

  function showSessionInfo(session) {
    sessionInfo.style.display = 'block';
    errorInfo.style.display = 'none';
    joinBtn.disabled = false;
    joinBtn.style.opacity = '1';
    joinBtn.style.cursor = 'pointer';
    joinBtn.innerHTML = '🚪 Entrar';

    dialog.querySelector('#foundSessionName').textContent = session.name;
    dialog.querySelector('#foundStoryName').textContent = session.storyTitle || 'N/A';

    const participantCount = session.participants?.length || 0;
    dialog.querySelector('#foundPlayerCount').textContent = `${participantCount}/${session.maxPlayers}`;

    const statusLabels = {
      'WAITING_PLAYERS': 'Aguardando jogadores',
      'CREATING_CHARACTERS': 'Criando personagens',
      'IN_PROGRESS': 'Em andamento',
      'COMPLETED': 'Concluída',
    };
    dialog.querySelector('#foundStatus').textContent = statusLabels[session.status] || session.status;
  }

  function showError(message) {
    sessionInfo.style.display = 'none';
    errorInfo.style.display = 'block';
    joinBtn.disabled = true;
    joinBtn.style.opacity = '0.5';
    joinBtn.style.cursor = 'not-allowed';
    joinBtn.innerHTML = '🚪 Entrar';
    dialog.querySelector('#errorMessage').textContent = message;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (currentSession) {
      manager.closeDialog();
      window.location.href = `/waiting-room.html?sessionId=${currentSession.id}`;
    }
  });

  if (!document.getElementById('join-dialog-styles')) {
    const style = document.createElement('style');
    style.id = 'join-dialog-styles';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  return dialog;
}
