export class DialogManager {
  constructor() {
    this.overlay = null;
    this.currentSelectCallback = null;
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

  showDialog(dialog) {
    this.overlay.innerHTML = '';
    this.overlay.appendChild(dialog);
    this.overlay.style.display = 'flex';

    const selectButtons = dialog.querySelectorAll('.btn-select-story');
    selectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const storyId = e.target.dataset.storyId;
        const storyCard = e.target.closest('.story-card-catalog');
        const storyTitle = storyCard.querySelector('h3').textContent;

        if (this.currentSelectCallback) {
          this.currentSelectCallback(storyId, storyTitle);
        }

        this.closeDialog();
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 12px rgba(34, 139, 34, 0.4)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      });
    });

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
}
