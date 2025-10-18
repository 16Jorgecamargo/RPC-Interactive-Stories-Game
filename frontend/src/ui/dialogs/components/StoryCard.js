export function createStoryCardHTML(story, onSelectCallback) {
  const genreColors = {
    'Fantasia': '#9B59B6',
    'Ficção Científica': '#4A90E2',
    'Terror': '#8B0000',
    'Mistério': '#4B0082',
    'Aventura': '#E67E22',
    'Drama': '#C0392B',
  };

  const difficultyMap = {
    'Fácil': { label: 'Iniciante', style: 'background: #228B22; color: white;' },
    'Médio': { label: 'Intermediário', style: 'background: #FFA500; color: white;' },
    'Difícil': { label: 'Avançado', style: 'background: #DC143C; color: white;' },
    'Extremo': { label: 'Mestre', style: 'background: #8B0000; color: white;' },
  };

  const genre = story.metadata?.genre || 'Desconhecido';
  const difficulty = story.metadata?.difficulty || 'Médio';
  const synopsis = story.metadata?.synopsis || story.description;
  const minPlayers = story.metadata?.recommendedPlayers?.min || 2;
  const maxPlayers = story.metadata?.recommendedPlayers?.max || 6;
  const estimatedDuration = story.metadata?.estimatedDuration || 'N/A';
  const totalChapters = story.totalChapters || 'N/A';

  const difficultyInfo = difficultyMap[difficulty] || { label: difficulty, style: 'background: #666; color: white;' };

  const shortSynopsis = synopsis.length > 150 ? synopsis.substring(0, 150) + '...' : synopsis;
  const hasMoreText = synopsis.length > 150;

  return `
    <div class="story-card-catalog" data-genre="${genre}" data-difficulty="${difficulty}" data-min-players="${minPlayers}" data-max-players="${maxPlayers}" style="background: linear-gradient(145deg, rgba(93, 64, 55, 0.6), rgba(62, 36, 23, 0.6)); border: 2px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 0; overflow: hidden; transition: all 0.3s ease; display: flex; flex-direction: column;">
      <div style="background: linear-gradient(135deg, ${genreColors[genre] || '#666'}, ${genreColors[genre] || '#888'}); padding: 15px; flex-shrink: 0;">
        <h3 style="color: white; margin: 0 0 8px 0; font-family: 'Cinzel Decorative', serif; font-size: 1.1rem; min-height: 2.2rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">📖 ${story.title}</h3>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span class="badge" style="background: ${genreColors[genre] || '#666'}; color: white; opacity: 0.9; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${genre}</span>
          <span class="badge" style="${difficultyInfo.style} font-size: 0.75rem; padding: 3px 8px; border-radius: 4px;">${difficultyInfo.label}</span>
        </div>
      </div>

      <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
        <div style="flex: 1; min-height: 0;">
          <div style="margin-bottom: 15px;">
            <p class="synopsis-text" style="color: #F4E4BC; font-size: 0.9rem; line-height: 1.5; margin: 0;">
              <span class="synopsis-short">${shortSynopsis}</span>
              <span class="synopsis-full" style="display: none;">${synopsis}</span>
            </p>
            ${hasMoreText ? `
              <button class="btn-toggle-synopsis" style="background: none; border: none; color: #D4AF37; cursor: pointer; font-family: 'Cinzel', serif; font-size: 0.85rem; margin-top: 5px; padding: 0; text-decoration: underline; transition: color 0.3s;">
                <span class="toggle-text">📖 Ver completo</span>
              </button>
            ` : ''}
          </div>

          <div class="story-info-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; font-size: 0.85rem;">
            <p style="margin: 5px 0;"><strong style="color: #D4AF37;">👥 Jogadores:</strong> <span style="color: #F4E4BC;">${minPlayers}-${maxPlayers}</span></p>
            <p style="margin: 5px 0;"><strong style="color: #D4AF37;">⏱️ Duração:</strong> <span style="color: #F4E4BC;">${estimatedDuration}</span></p>
            <p style="margin: 5px 0;"><strong style="color: #D4AF37;">📊 Capítulos:</strong> <span style="color: #F4E4BC;">${totalChapters}</span></p>
            <p style="margin: 5px 0;"><strong style="color: #D4AF37;">⚡ Nível:</strong> <span style="color: #F4E4BC;">${difficultyInfo.label}</span></p>
          </div>
        </div>

        <button class="btn-select-story" data-story-id="${story.id}" style="width: 100%; font-family: 'Cinzel', serif; font-weight: 600; padding: 12px; border: 2px solid #228B22; border-radius: 8px; background: linear-gradient(145deg, #228B22, #1E7B1E); color: white; cursor: pointer; transition: all 0.3s ease; flex-shrink: 0; margin-top: auto;">
          ✅ Escolher História
        </button>
      </div>
    </div>
  `;
}
