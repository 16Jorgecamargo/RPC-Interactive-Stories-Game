export function showStoryInfo(manager, config = {}) {
  const defaults = {
    storyTitle: 'História',
    storyGenre: 'Desconhecido',
    storySynopsis: 'Sinopse não disponível.',
    closeCallback: null,
  };

  const finalConfig = { ...defaults, ...config };

  const dialog = createStoryInfoDialog(manager, finalConfig);
  manager.showDialog(dialog);
}

export function createStoryInfoDialog(manager, config) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog fade-in';
  dialog.style.cssText = `
    max-width: 600px;
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
      <h2 style="color: #D4AF37; margin: 0 0 10px 0; font-family: 'Cinzel Decorative', serif;">📖 ${config.storyTitle}</h2>
      <span style="display: inline-block; padding: 5px 15px; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; border-radius: 20px; color: #D4AF37; font-size: 0.9rem; font-family: 'Cinzel', serif;">
        🎭 ${config.storyGenre}
      </span>
    </div>

    <div style="background: rgba(244, 228, 188, 0.1); padding: 20px; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3);">
      <h3 style="color: #D4AF37; margin: 0 0 15px 0; font-family: 'Cinzel', serif; font-size: 1.1rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px;">
        📜 Sinopse
      </h3>
      <p style="color: #F4E4BC; line-height: 1.8; margin: 0; font-family: 'Lora', serif; font-size: 1rem; text-align: justify;">
        ${config.storySynopsis}
      </p>
    </div>
  `;

  const closeBtn = dialog.querySelector('.dialog-close');

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

  return dialog;
}
