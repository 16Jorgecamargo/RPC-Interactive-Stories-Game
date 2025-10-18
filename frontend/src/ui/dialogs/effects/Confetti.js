export function createConfetti(dialog) {
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
