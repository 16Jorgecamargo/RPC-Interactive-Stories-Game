export function showError(manager, config = {}) {
  const defaults = {
    title: 'Erro na Aventura!',
    message: 'Ops! Algo deu errado na sua jornada...',
    showRetry: false,
    retryCallback: null,
    closeCallback: null,
  };

  const finalConfig = { ...defaults, ...config };

  const dialog = createErrorDialog(manager, finalConfig);
  manager.showDialog(dialog);
}

export function createErrorDialog(manager, config) {
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
    manager.closeDialog();
    if (config.closeCallback) config.closeCallback();
  };

  closeBtn.addEventListener('click', closeAction);
  errorCloseBtn.addEventListener('click', closeAction);

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      manager.closeDialog();
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
