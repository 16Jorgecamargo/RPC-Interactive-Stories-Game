import { z } from 'zod';

// ===== JSON-RPC Types =====
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

// ===== Story Types =====
export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  nextCard: z.string(),
});

export const CardSchema = z.object({
  id: z.string(),
  text: z.string(),
  choices: z.array(ChoiceSchema),
});

export const StorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  cards: z.array(CardSchema),
});

export type Choice = z.infer<typeof ChoiceSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Story = z.infer<typeof StorySchema>;

// ===== Game Types =====
export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Vote {
  playerId: string;
  choiceId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface DeleteRoomVote {
  playerId: string;
  vote: boolean;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  storyId: string;
  currentCardId: string;
  players: Map<string, Player>;
  votes: Map<string, Vote>;
  messages: ChatMessage[];
  createdAt: number;
  events: GameEvent[];
  eventIdCounter: number;
  deleteRoomVotes?: Map<string, DeleteRoomVote>;
  deleteRoomInitiatedAt?: number;
}

// ===== Event Types =====
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

// ===== Method Parameters =====
export const CreateRoomParamsSchema = z.object({
  name: z.string().min(1),
  storyId: z.string(),
});

export const JoinRoomParamsSchema = z.object({
  roomId: z.string(),
  playerName: z.string().min(1),
});

export const LeaveRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

export const VoteParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  choiceId: z.string(),
});

export const SendMessageParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  message: z.string().min(1),
});

export const GetGameStateParamsSchema = z.object({
  roomId: z.string(),
});

export const WaitForEventsParamsSchema = z.object({
  roomId: z.string(),
  lastEventId: z.number(),
});

export const InitiateDeleteRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

export const VoteDeleteRoomParamsSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  vote: z.boolean(),
});

export type CreateRoomParams = z.infer<typeof CreateRoomParamsSchema>;
export type JoinRoomParams = z.infer<typeof JoinRoomParamsSchema>;
export type LeaveRoomParams = z.infer<typeof LeaveRoomParamsSchema>;
export type VoteParams = z.infer<typeof VoteParamsSchema>;
export type SendMessageParams = z.infer<typeof SendMessageParamsSchema>;
export type GetGameStateParams = z.infer<typeof GetGameStateParamsSchema>;
export type WaitForEventsParams = z.infer<typeof WaitForEventsParamsSchema>;
export type InitiateDeleteRoomParams = z.infer<typeof InitiateDeleteRoomParamsSchema>;
export type VoteDeleteRoomParams = z.infer<typeof VoteDeleteRoomParamsSchema>;
