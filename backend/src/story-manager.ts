import { Story, StorySchema, Card } from './types.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { storyLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class StoryManager {
  private stories: Map<string, Story> = new Map();

  constructor() {
    this.loadStories();
  }

  private loadStories() {
    const storiesDir = join(__dirname, '..', 'stories');

    try {
      const files = readdirSync(storiesDir).filter(file => file.endsWith('.json'));

      files.forEach(file => {
        try {
          const filePath = join(storiesDir, file);
          const fileContent = readFileSync(filePath, 'utf-8');
          const storyData = JSON.parse(fileContent);

          // Validar com Zod
          const validated = StorySchema.parse(storyData);
          this.stories.set(validated.id, validated);

          storyLogger.info({ storyId: validated.id, title: validated.title }, `História carregada: ${validated.title}`);
        } catch (error) {
          storyLogger.error({ file, error }, `Erro ao carregar história ${file}`);
        }
      });

      storyLogger.info({ count: this.stories.size }, `Total de histórias carregadas: ${this.stories.size}`);
    } catch (error) {
      storyLogger.error({ error }, 'Erro ao ler diretório de histórias');
    }
  }

  getStory(id: string): Story | undefined {
    return this.stories.get(id);
  }

  getAllStories(): Story[] {
    return Array.from(this.stories.values());
  }

  getCard(storyId: string, cardId: string): Card | undefined {
    const story = this.getStory(storyId);
    return story?.cards.find((card) => card.id === cardId);
  }
}
