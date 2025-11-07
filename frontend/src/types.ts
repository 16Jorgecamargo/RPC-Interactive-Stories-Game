// JSON-RPC Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

// Story Types
export interface Choice {
  id: string;
  text: string;
  nextCard: string;
}

export interface Card {
  id: string;
  text: string;
  choices: Choice[];
}

export interface Story {
  id: string;
  title: string;
  description?: string;
}

// Game Types
export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Room {
  id: string;
  name: string;
  storyId: string;
  storyTitle?: string;
}

export interface CountdownState {
  countdownType: 'vote' | 'card';
  durationMs: number;
  startedAt: number;
}

export interface GameState {
  room: Room;
  currentCard: Card;
  players: Player[];
  votes: Record<string, number>;
  playerVoted: string[];
  messages: ChatMessage[];
  lastEventId: number;
  deleteRoomVoting?: {
    yesVotes: number;
    noVotes: number;
    total: number;
    votedPlayers: string[];
  };
  countdowns?: CountdownState[];
}

// Event Types
export type GameEvent =
  | { id: number; type: 'playerJoined'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'playerLeft'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'vote'; data: { playerId: string; playerName: string; choiceId: string } }
  | { id: number; type: 'cardChanged'; data: { newCardId: string } }
  | { id: number; type: 'message'; data: ChatMessage }
  | { id: number; type: 'deleteRoomInitiated'; data: { playerId: string; playerName: string } }
  | { id: number; type: 'deleteRoomVoted'; data: { playerId: string; playerName: string; vote: boolean; yesVotes: number; noVotes: number; total: number } }
  | { id: number; type: 'roomDeleted'; data: { reason: string } }
  | { id: number; type: 'countdownStarted'; data: { countdownType: 'vote' | 'card'; durationMs: number; startedAt: number } }
  | { id: number; type: 'countdownFinished'; data: { countdownType: 'vote' | 'card'; reason?: string } };

// Room List
export interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  storyTitle: string;
}
