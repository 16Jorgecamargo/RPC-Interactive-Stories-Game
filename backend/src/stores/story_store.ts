import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Story } from '../models/story_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStories(): Story[] {
  if (!fs.existsSync(STORIES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(STORIES_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveStories(stories: Story[]): void {
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2));
}

export function createStory(story: Story): Story {
  const stories = loadStories();
  stories.push(story);
  saveStories(stories);
  return story;
}

export function findById(id: string): Story | undefined {
  const stories = loadStories();
  return stories.find((s) => s.id === id);
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
