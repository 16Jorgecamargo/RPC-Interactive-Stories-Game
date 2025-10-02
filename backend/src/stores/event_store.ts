import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TimelineEntry } from '../models/game_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadEvents(): TimelineEntry[] {
  if (!fs.existsSync(EVENTS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveEvents(events: TimelineEntry[]): void {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

export function addEvent(event: TimelineEntry): TimelineEntry {
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
  return event;
}

export function findBySessionId(sessionId: string, limit?: number): TimelineEntry[] {
  const events = loadEvents();
  const sessionEvents = events
    .filter((e) => e.sessionId === sessionId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (limit) {
    return sessionEvents.slice(-limit);
  }

  return sessionEvents;
}

export function findAll(): TimelineEntry[] {
  return loadEvents();
}

export function deleteBySessionId(sessionId: string): number {
  const events = loadEvents();
  const initialLength = events.length;
  const filteredEvents = events.filter((e) => e.sessionId !== sessionId);
  saveEvents(filteredEvents);
  return initialLength - filteredEvents.length;
}

export function clearOldEvents(olderThanDays: number = 30): number {
  const events = loadEvents();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const initialLength = events.length;
  const recentEvents = events.filter((e) => new Date(e.timestamp) > cutoffDate);
  saveEvents(recentEvents);
  return initialLength - recentEvents.length;
}
