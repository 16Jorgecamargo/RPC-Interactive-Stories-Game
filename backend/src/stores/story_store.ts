import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Story } from '../models/story_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const STORIES_DIR = path.join(__dirname, '../../stories');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let storiesCache: Story[] | null = null;
const storyIndexById = new Map<string, Story>();

function loadStoriesFromFolders(): Story[] {
  if (!fs.existsSync(STORIES_DIR)) {
    return [];
  }

  const storyFolders = fs.readdirSync(STORIES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const stories: Story[] = [];

  for (const folderName of storyFolders) {
    const storyJsonPath = path.join(STORIES_DIR, folderName, 'story.json');

    if (fs.existsSync(storyJsonPath)) {
      try {
        const storyData = JSON.parse(fs.readFileSync(storyJsonPath, 'utf-8'));
        stories.push(storyData);
      } catch (error) {
        console.error(`Erro ao carregar história de ${folderName}:`, error);
      }
    }
  }

  return stories;
}

function loadStories(): Story[] {
  if (storiesCache !== null) {
    return storiesCache;
  }

  const folderStories = loadStoriesFromFolders();

  let fileStories: Story[] = [];
  if (fs.existsSync(STORIES_FILE)) {
    try {
      const data = fs.readFileSync(STORIES_FILE, 'utf-8');
      fileStories = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar stories.json:', error);
      fileStories = [];
    }
  }

  storiesCache = [...folderStories, ...fileStories];

  storyIndexById.clear();
  for (const story of storiesCache) {
    storyIndexById.set(story.id, story);
  }

  return storiesCache;
}

function saveStories(stories: Story[]): void {
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2));
  storiesCache = stories;

  storyIndexById.clear();
  for (const story of stories) {
    storyIndexById.set(story.id, story);
  }
}

export function createStory(story: Story): Story {
  const stories = loadStories();
  stories.push(story);
  saveStories(stories);
  return story;
}

export function findById(id: string): Story | undefined {
  loadStories();
  return storyIndexById.get(id);
}

export function findAll(): Story[] {
  return loadStories();
}

export function findActive(): Story[] {
  const stories = loadStories();
  return stories.filter((s) => s.isActive);
}

export function updateStory(id: string, updates: Partial<Omit<Story, 'id' | 'createdBy' | 'createdAt'>>): Story | null {
  const stories = loadStories();
  const index = stories.findIndex((s) => s.id === id);

  if (index === -1) {
    return null;
  }

  stories[index] = {
    ...stories[index],
    ...updates,
  };

  saveStories(stories);
  return stories[index];
}

export function deleteStory(id: string): boolean {
  const stories = loadStories();
  const index = stories.findIndex((s) => s.id === id);

  if (index === -1) {
    return false;
  }

  stories.splice(index, 1);
  saveStories(stories);
  return true;
}

export function reloadStories(): void {
  storiesCache = null;
  loadStories();
}
