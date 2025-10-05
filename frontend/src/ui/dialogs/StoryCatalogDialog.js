import { createStoryCardHTML } from './components/StoryCard.js';

export function showStoryCatalog(manager, config = {}) {
  const defaults = {
    stories: [],
    onSelectStory: null,
    closeCallback: null,
  };

  const finalConfig = { ...defaults, ...config };

  // Store callback for use in showDialog
  manager.currentSelectCallback = finalConfig.onSelectStory;

  const dialog = createStoryCatalogDialog(manager, finalConfig);
  manager.showDialog(dialog);
}

export function createStoryCatalogDialog(manager, config) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog fade-in';
  dialog.style.cssText = `
    max-width: 900px;
    width: 95%;
    max-height: 85vh;
    background: linear-gradient(145deg, #3E2417, #5D4037);
    border: 2px solid #D4AF37;
    border-radius: 15px;
    padding: 0;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  `;

  const storiesHTML = config.stories.length > 0
    ? config.stories.map(story => createStoryCardHTML(story, config.onSelectStory)).join('')
    : '<p style="text-align: center; color: var(--silver); padding: 40px;">Nenhuma história disponível no momento.</p>';

  dialog.innerHTML = `
    <button class="dialog-close" style="position: absolute; top: 15px; right: 15px; background: rgba(139, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; z-index: 3; transition: all 0.3s;">✕</button>

    <div style="padding: 30px 30px 20px 30px; border-bottom: 2px solid rgba(212, 175, 55, 0.3); flex-shrink: 0;">
      <h2 style="color: #D4AF37; margin: 0 0 10px 0; font-family: 'Cinzel Decorative', serif; text-align: center;">📚 Catálogo de Histórias Épicas</h2>
      <p style="color: #D4AF37; font-style: italic; text-align: center; margin: 0;">
        "Cada história é um portal para um mundo novo"
      </p>
    </div>

    <div style="border-bottom: 2px solid rgba(212, 175, 55, 0.3); flex-shrink: 0; background: rgba(45, 24, 16, 0.3);">
      <button id="toggleFiltersBtn" class="toggle-filters-btn" style="display: none; width: 100%; padding: 12px; background: rgba(212, 175, 55, 0.2); border: none; color: #D4AF37; font-family: 'Cinzel', serif; font-weight: 600; cursor: pointer; border-bottom: 2px solid rgba(212, 175, 55, 0.3);">
        🔍 <span id="filterToggleText">Mostrar Filtros</span>
      </button>
      <div id="filtersContainer" class="catalog-filters-container" style="padding: 20px 30px;">
        <div class="catalog-filters" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <label style="display: block; color: #D4AF37; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">🎭 Gênero</label>
            <select id="genreFilter" class="filter-select" style="width: 100%; padding: 8px; border: 2px solid #D4AF37; border-radius: 6px; background: rgba(244, 228, 188, 0.1); color: #F4E4BC; font-family: 'Cinzel', serif;">
              <option value="">Todos os gêneros</option>
            </select>
          </div>
          <div>
            <label style="display: block; color: #D4AF37; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">⚡ Dificuldade</label>
            <select id="difficultyFilter" class="filter-select" style="width: 100%; padding: 8px; border: 2px solid #D4AF37; border-radius: 6px; background: rgba(244, 228, 188, 0.1); color: #F4E4BC; font-family: 'Cinzel', serif;">
              <option value="">Qualquer nível</option>
              <option value="Fácil">Iniciante</option>
              <option value="Médio">Intermediário</option>
              <option value="Difícil">Avançado</option>
              <option value="Extremo">Mestre</option>
            </select>
          </div>
          <div>
            <label style="display: block; color: #D4AF37; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">👥 Jogadores</label>
            <select id="playersFilter" class="filter-select" style="width: 100%; padding: 8px; border: 2px solid #D4AF37; border-radius: 6px; background: rgba(244, 228, 188, 0.1); color: #F4E4BC; font-family: 'Cinzel', serif;">
              <option value="">Qualquer número</option>
              <option value="2">2 jogadores</option>
              <option value="3">3 jogadores</option>
              <option value="4">4 jogadores</option>
              <option value="5">5 jogadores</option>
              <option value="6+">6+ jogadores</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="catalog-content" style="flex: 1; overflow-y: auto; padding: 20px 30px; min-height: 0;">
      <div class="stories-grid" style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        ${storiesHTML}
      </div>
    </div>
  `;

  // Adicionar scrollbar customizado
  const catalogContent = dialog.querySelector('.catalog-content');
  catalogContent.style.cssText += `
    overflow-y: auto;
    overflow-x: hidden;
  `;

  // Estilo do scrollbar
  const style = document.createElement('style');
  style.textContent = `
    .catalog-content::-webkit-scrollbar {
      width: 10px;
    }
    .catalog-content::-webkit-scrollbar-track {
      background: rgba(45, 24, 16, 0.3);
      border-radius: 5px;
    }
    .catalog-content::-webkit-scrollbar-thumb {
      background: linear-gradient(145deg, #D4AF37, #B8860B);
      border-radius: 5px;
    }
    .catalog-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(145deg, #E6C547, #D4AF37);
    }
  `;
  document.head.appendChild(style);

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

  // Popular filtro de gêneros dinamicamente
  const genreFilter = dialog.querySelector('#genreFilter');
  const uniqueGenres = [...new Set(config.stories.map(s => s.metadata?.genre).filter(Boolean))];
  uniqueGenres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });

  // Adicionar lógica de filtros
  const filterStories = () => {
    const genre = dialog.querySelector('#genreFilter').value;
    const difficulty = dialog.querySelector('#difficultyFilter').value;
    const players = dialog.querySelector('#playersFilter').value;

    const storyCards = dialog.querySelectorAll('.story-card-catalog');

    storyCards.forEach(card => {
      let show = true;

      if (genre && card.dataset.genre !== genre) show = false;
      if (difficulty && card.dataset.difficulty !== difficulty) show = false;
      if (players && players !== '6+') {
        const minPlayers = parseInt(card.dataset.minPlayers);
        const maxPlayers = parseInt(card.dataset.maxPlayers);
        const targetPlayers = parseInt(players);
        if (targetPlayers < minPlayers || targetPlayers > maxPlayers) show = false;
      } else if (players === '6+') {
        const maxPlayers = parseInt(card.dataset.maxPlayers);
        if (maxPlayers < 6) show = false;
      }

      card.style.display = show ? 'flex' : 'none';
    });
  };

  dialog.querySelector('#genreFilter').addEventListener('change', filterStories);
  dialog.querySelector('#difficultyFilter').addEventListener('change', filterStories);
  dialog.querySelector('#playersFilter').addEventListener('change', filterStories);

  // Toggle filtros em mobile
  const toggleFiltersBtn = dialog.querySelector('#toggleFiltersBtn');
  const filtersContainer = dialog.querySelector('#filtersContainer');
  const filterToggleText = dialog.querySelector('#filterToggleText');

  toggleFiltersBtn.addEventListener('click', () => {
    const isHidden = window.getComputedStyle(filtersContainer).display === 'none';

    if (isHidden) {
      filtersContainer.style.display = 'block';
      filterToggleText.textContent = 'Ocultar Filtros';
    } else {
      filtersContainer.style.display = 'none';
      filterToggleText.textContent = 'Mostrar Filtros';
    }
  });

  toggleFiltersBtn.addEventListener('mouseenter', () => {
    toggleFiltersBtn.style.background = 'rgba(212, 175, 55, 0.3)';
  });

  toggleFiltersBtn.addEventListener('mouseleave', () => {
    toggleFiltersBtn.style.background = 'rgba(212, 175, 55, 0.2)';
  });

  // Adicionar event listeners para expandir/recolher sinopse
  const toggleButtons = dialog.querySelectorAll('.btn-toggle-synopsis');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.story-card-catalog');
      const shortSpan = card.querySelector('.synopsis-short');
      const fullSpan = card.querySelector('.synopsis-full');
      const toggleText = btn.querySelector('.toggle-text');

      if (fullSpan.style.display === 'none') {
        shortSpan.style.display = 'none';
        fullSpan.style.display = 'inline';
        toggleText.textContent = '📕 Ver menos';
      } else {
        shortSpan.style.display = 'inline';
        fullSpan.style.display = 'none';
        toggleText.textContent = '📖 Ver completo';
      }
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.color = '#E6C547';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.color = '#D4AF37';
    });
  });

  // Adicionar responsividade
  const mediaStyle = document.createElement('style');
  mediaStyle.textContent = `
    @media (max-width: 768px) {
      .toggle-filters-btn {
        display: block !important;
      }
      .catalog-filters-container {
        display: none;
      }
      .catalog-filters {
        grid-template-columns: 1fr !important;
      }
      .story-info-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    @media (max-width: 480px) {
      .dialog {
        max-width: 100% !important;
        margin: 10px !important;
      }
    }
    @media (max-width: 450px) {
      .story-info-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(mediaStyle);

  return dialog;
}
