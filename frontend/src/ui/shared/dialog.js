// Sistema de Dialogs Customizados
export class DialogManager {
  constructor() {
    this.overlay = null;
    this.initializeOverlay();
  }

  initializeOverlay() {
    if (document.getElementById('dialogOverlay')) {
      this.overlay = document.getElementById('dialogOverlay');
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'dialogOverlay';
    this.overlay.className = 'dialog-overlay';
    this.overlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      z-index: 10000;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-in-out;
    `;
    document.body.appendChild(this.overlay);
  }

  showSuccess(config = {}) {
    const defaults = {
      title: 'Sucesso na Aventura!',
      message: 'Operação realizada com sucesso!',
      showConfetti: true,
      showContinue: false,
      continueText: '➡️ Continuar',
      continueCallback: null,
      closeCallback: null,
    };

    const finalConfig = { ...defaults, ...config };

    const dialog = this.createSuccessDialog(finalConfig);
    this.showDialog(dialog);

    if (finalConfig.showConfetti) {
      this.createConfetti(dialog);
    }
  }

  showError(config = {}) {
    const defaults = {
      title: 'Erro na Aventura!',
      message: 'Ops! Algo deu errado na sua jornada...',
      showRetry: false,
      retryCallback: null,
      closeCallback: null,
    };

    const finalConfig = { ...defaults, ...config };

    const dialog = this.createErrorDialog(finalConfig);
    this.showDialog(dialog);
  }

  createSuccessDialog(config) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog fade-in';
    dialog.style.cssText = `
      max-width: 450px;
      width: 90%;
      background: linear-gradient(145deg, #3E2417, #5D4037);
      border: 2px solid #228B22;
      border-radius: 15px;
      padding: 30px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    dialog.innerHTML = `
      <button class="dialog-close" style="position: absolute; top: 15px; right: 15px; background: rgba(139, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; z-index: 3; transition: all 0.3s;">✕</button>

      <div id="confettiContainer" style="position: absolute; top: 0; left: 0; right: 0; height: 100%; pointer-events: none; z-index: 1;"></div>

      <div style="text-align: center; background: linear-gradient(145deg, #228B22, #1E7B1E); margin: -30px -30px 20px -30px; padding: 20px 30px; border-radius: 15px 15px 0 0; position: relative; z-index: 2;">
        <div class="success-icon" style="font-size: 3rem; color: white; margin-bottom: 10px; animation: successPulse 2s ease-in-out infinite;">
          <svg width="60" height="60" viewBox="0 0 60 60" style="display: inline-block;">
            <circle cx="30" cy="30" r="25" fill="none" stroke="white" stroke-width="3"/>
            <path class="checkmark" d="M20,30 L25,35 L40,20" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="0" style="animation: checkmark 1s ease-in-out forwards;"/>
          </svg>
        </div>
        <h2 style="color: white; margin: 0; font-family: 'Cinzel Decorative', serif;">${config.title}</h2>
      </div>

      <div style="text-align: center; margin-bottom: 25px; position: relative; z-index: 2;">
        <div style="background: rgba(34, 139, 34, 0.1); padding: 20px; border-radius: 8px; border: 1px solid #228B22; margin-bottom: 20px;">
          <p style="color: #F4E4BC; font-size: 1.1rem; line-height: 1.5; margin: 0; font-family: 'Cinzel', serif;">
            ${config.message}
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 10px; position: relative; z-index: 2;">
        <button class="btn-success-confirm" style="flex: 1; font-family: 'Cinzel', serif; font-weight: 600; padding: 12px 30px; border: 2px solid #228B22; border-radius: 8px; background: linear-gradient(145deg, #228B22, #1E7B1E); color: white; cursor: pointer; transition: all 0.3s ease;">
          ✅ ${config.showContinue ? config.continueText : 'Perfeito!'}
        </button>
      </div>
    `;

    const closeBtn = dialog.querySelector('.dialog-close');
    const confirmBtn = dialog.querySelector('.btn-success-confirm');

    const closeAction = () => {
      this.closeDialog();
      if (config.closeCallback) config.closeCallback();
    };

    const confirmAction = () => {
      this.closeDialog();
      if (config.continueCallback) {
        config.continueCallback();
      } else if (config.closeCallback) {
        config.closeCallback();
      }
    };

    closeBtn.addEventListener('click', closeAction);
    confirmBtn.addEventListener('click', confirmAction);

    // Hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'scale(1.1)';
      closeBtn.style.background = 'rgba(139, 0, 0, 1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'scale(1)';
      closeBtn.style.background = 'rgba(139, 0, 0, 0.8)';
    });

    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.transform = 'translateY(-2px)';
      confirmBtn.style.boxShadow = '0 4px 12px rgba(34, 139, 34, 0.4)';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.transform = 'translateY(0)';
      confirmBtn.style.boxShadow = 'none';
    });

    return dialog;
  }

  createErrorDialog(config) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog fade-in';
    dialog.style.cssText = `
      max-width: 450px;
      width: 90%;
      background: linear-gradient(145deg, #3E2417, #5D4037);
      border: 2px solid #8B0000;
      border-radius: 15px;
      padding: 30px;
      position: relative;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    const buttonsHtml = config.showRetry
      ? `
        <button class="btn-error-close" style="flex: 1; font-family: 'Cinzel', serif; font-weight: 600; padding: 12px 30px; border: 2px solid #C0C0C0; border-radius: 8px; background: linear-gradient(145deg, #C0C0C0, #A8A8A8); color: #2D1810; cursor: pointer; transition: all 0.3s ease;">
          🚪 Fechar
        </button>
        <button class="btn-error-retry" style="flex: 1; font-family: 'Cinzel', serif; font-weight: 600; padding: 12px 30px; border: 2px solid #8B0000; border-radius: 8px; background: linear-gradient(145deg, #8B0000, #A00000); color: white; cursor: pointer; transition: all 0.3s ease;">
          🔄 Tentar Novamente
        </button>
      `
      : `
        <button class="btn-error-close" style="width: 100%; font-family: 'Cinzel', serif; font-weight: 600; padding: 12px 30px; border: 2px solid #D4AF37; border-radius: 8px; background: linear-gradient(145deg, #D4AF37, #B8860B); color: #2D1810; cursor: pointer; transition: all 0.3s ease;">
          ✅ OK
        </button>
      `;

    dialog.innerHTML = `
      <button class="dialog-close" style="position: absolute; top: 15px; right: 15px; background: rgba(139, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; z-index: 3; transition: all 0.3s;">✕</button>

      <div style="text-align: center; background: linear-gradient(145deg, #8B0000, #A00000); margin: -30px -30px 20px -30px; padding: 20px 30px; border-radius: 15px 15px 0 0;">
        <div style="font-size: 3rem; color: white; margin-bottom: 10px;">⚠️</div>
        <h2 style="color: white; margin: 0; font-family: 'Cinzel Decorative', serif;">${config.title}</h2>
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <div style="background: rgba(139, 0, 0, 0.1); padding: 20px; border-radius: 8px; border: 1px solid #8B0000; margin-bottom: 20px;">
          <p style="color: #F4E4BC; font-size: 1.1rem; line-height: 1.5; margin: 0; font-family: 'Cinzel', serif;">
            ${config.message}
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        ${buttonsHtml}
      </div>
    `;

    const closeBtn = dialog.querySelector('.dialog-close');
    const errorCloseBtn = dialog.querySelector('.btn-error-close');
    const retryBtn = dialog.querySelector('.btn-error-retry');

    const closeAction = () => {
      this.closeDialog();
      if (config.closeCallback) config.closeCallback();
    };

    closeBtn.addEventListener('click', closeAction);
    errorCloseBtn.addEventListener('click', closeAction);

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.closeDialog();
        if (config.retryCallback) config.retryCallback();
      });

      retryBtn.addEventListener('mouseenter', () => {
        retryBtn.style.transform = 'translateY(-2px)';
        retryBtn.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.4)';
      });
      retryBtn.addEventListener('mouseleave', () => {
        retryBtn.style.transform = 'translateY(0)';
        retryBtn.style.boxShadow = 'none';
      });
    }

    // Hover effects
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'scale(1.1)';
      closeBtn.style.background = 'rgba(139, 0, 0, 1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'scale(1)';
      closeBtn.style.background = 'rgba(139, 0, 0, 0.8)';
    });

    errorCloseBtn.addEventListener('mouseenter', () => {
      errorCloseBtn.style.transform = 'translateY(-2px)';
      errorCloseBtn.style.boxShadow = '0 4px 12px rgba(192, 192, 192, 0.4)';
    });
    errorCloseBtn.addEventListener('mouseleave', () => {
      errorCloseBtn.style.transform = 'translateY(0)';
      errorCloseBtn.style.boxShadow = 'none';
    });

    return dialog;
  }

  showDialog(dialog) {
    this.overlay.innerHTML = '';
    this.overlay.appendChild(dialog);
    this.overlay.style.display = 'flex';

    // Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeDialog();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  closeDialog() {
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = '';
  }

  createConfetti(dialog) {
    const container = dialog.querySelector('#confettiContainer');
    if (!container) return;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const shapes = ['▪', '▲', '●', '★', '♦'];

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.style.cssText = `
          position: absolute;
          top: -10px;
          left: ${Math.random() * 100}%;
          color: ${colors[Math.floor(Math.random() * colors.length)]};
          font-size: ${Math.random() * 10 + 10}px;
          animation: confetti-fall ${Math.random() * 2 + 2}s linear infinite;
          animation-delay: ${Math.random() * 2}s;
        `;

        container.appendChild(confetti);

        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 5000);
      }, i * 100);
    }

    // Add animation styles
    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Export singleton instance
export const dialogManager = new DialogManager();
