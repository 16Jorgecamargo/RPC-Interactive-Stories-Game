export const ROUTES = {
  LOGIN: '/login.html',
  REGISTER: '/register.html',
  HOME: '/home.html',
  CHARACTERS: '/characters.html',
  CHARACTER_CREATE: '/character-create.html',
  SESSIONS: '/sessions.html',
  SESSION_CREATE: '/session-create.html',
  SESSION_LOBBY: '/session-lobby.html',
  GAME: '/gameplay.html',
  ADMIN: '/admin.html'
};

export const USER_ROLES = {
  PLAYER: 'PLAYER',
  ADMIN: 'ADMIN'
};

export const SESSION_STATUS = {
  WAITING_PLAYERS: 'WAITING_PLAYERS',
  CREATING_CHARACTERS: 'CREATING_CHARACTERS',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

export const TIE_RESOLUTION_STRATEGIES = {
  REVOTE: 'REVOTE',
  RANDOM: 'RANDOM',
  MASTER_DECIDES: 'MASTER_DECIDES'
};

export const CHARACTER_RACES = ['Human', 'Elf', 'Dwarf', 'Halfling'];
export const CHARACTER_CLASSES = ['Warrior', 'Mage', 'Rogue', 'Cleric'];

export const ATTRIBUTE_MIN = 3;
export const ATTRIBUTE_MAX = 18;

export const UPDATE_TYPES = {
  PLAYER_JOINED: 'PLAYER_JOINED',
  CHARACTER_CREATED: 'CHARACTER_CREATED',
  VOTE_RECEIVED: 'VOTE_RECEIVED',
  CHAPTER_CHANGED: 'CHAPTER_CHANGED',
  COMBAT_STARTED: 'COMBAT_STARTED',
  ATTACK_MADE: 'ATTACK_MADE',
  CHARACTER_DIED: 'CHARACTER_DIED',
  STORY_ENDED: 'STORY_ENDED'
};

export const POLLING_INTERVALS = {
  FAST: 2000,
  NORMAL: 5000,
  SLOW: 10000
};
