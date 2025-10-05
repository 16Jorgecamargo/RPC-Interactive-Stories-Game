import { createConfetti } from './effects/Confetti.js';

export function showSuccess(manager, config = {}) {
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

  const dialog = createSuccessDialog(manager, finalConfig);
  manager.showDialog(dialog);

  if (finalConfig.showConfetti) {
    createConfetti(dialog);
  }
}

export function createSuccessDialog(manager, config) {
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
    manager.closeDialog();
    if (config.closeCallback) config.closeCallback();
  };

  const confirmAction = () => {
    manager.closeDialog();
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
