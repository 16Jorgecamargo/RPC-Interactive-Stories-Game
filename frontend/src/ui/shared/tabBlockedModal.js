let modalElement = null;

export function showTabBlockedModal() {
  hideTabBlockedModal();

  const overlay = document.createElement('div');
  overlay.className = 'tab-blocked-overlay';
  overlay.id = 'tabBlockedOverlay';

  const modal = document.createElement('div');
  modal.className = 'tab-blocked-modal';
  modal.innerHTML = `
    <div class="icon">🚫</div>
    <h2>Múltiplas Abas Detectadas</h2>
    <p>
      Você abriu o RPC Interactive Stories em outra aba do navegador. 
      Por questões de sincronização e desempenho, apenas uma aba pode estar ativa por vez.
    </p>
    <div class="warning">
      <strong>⚠️ Atenção:</strong>
      Esta aba foi desativada. A outra aba permanece ativa. 
      Você pode fechar esta janela com segurança - sua sessão não será perdida.
    </div>
    <button id="closeTabBtn" type="button">
      Por que preciso fechar esta aba?
    </button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modalElement = overlay;

  const closeBtn = document.getElementById('closeTabBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
      
      setTimeout(() => {
        if (!window.closed) {
          modal.innerHTML = `
            <div class="icon">💡</div>
            <h2>Como Fechar Esta Aba</h2>
            <p style="font-size: 18px; margin-bottom: 25px;">
              Por questões de segurança, o navegador não permite fechar abas automaticamente.
            </p>
            <div class="warning">
              <strong>⌨️ Use um destes atalhos:</strong>
              <ul style="margin-top: 10px; text-align: left; line-height: 2;">
                <li><strong>Windows/Linux:</strong> Ctrl + W</li>
                <li><strong>Mac:</strong> Cmd (⌘) + W</li>
                <li><strong>Alternativa:</strong> Clique com botão direito na aba → Fechar</li>
              </ul>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #D4AF37;">
              A outra aba permanece ativa e funcionando normalmente.
            </p>
          `;
        }
      }, 100);
    });
  }

  document.body.style.overflow = 'hidden';

  console.log('[TAB BLOCKED] Modal de bloqueio exibido');
}

export function hideTabBlockedModal() {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
    document.body.style.overflow = '';
    console.log('[TAB BLOCKED] Modal de bloqueio removido');
  }
}

export function isModalVisible() {
  return modalElement !== null;
}
