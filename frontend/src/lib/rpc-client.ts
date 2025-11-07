import type { JsonRpcRequest, JsonRpcResponse } from '../types';

const RPC_ENDPOINT = '/rpc';

let requestIdCounter = 1;

export class RpcError extends Error {
  code: number;
  data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }
}

export async function rpcCall<T = any>(method: string, params?: any): Promise<T> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: requestIdCounter++,
  };

  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const jsonResponse: JsonRpcResponse = await response.json();

    if (jsonResponse.error) {
      throw new RpcError(
        jsonResponse.error.code,
        jsonResponse.error.message,
        jsonResponse.error.data
      );
    }

    return jsonResponse.result as T;
  } catch (error) {
    if (error instanceof RpcError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Métodos específicos
export const rpc = {
  async createRoom(name: string, storyId: string) {
    return rpcCall<{ roomId: string }>('createRoom', { name, storyId });
  },

  async joinRoom(roomId: string, playerName: string) {
    return rpcCall<{ playerId: string; gameState: any }>('joinRoom', { roomId, playerName });
  },

  async leaveRoom(roomId: string, playerId: string) {
    return rpcCall<{ success: boolean }>('leaveRoom', { roomId, playerId });
  },

  async vote(roomId: string, playerId: string, choiceId: string) {
    return rpcCall<{ voteCount: Record<string, number> }>('vote', { roomId, playerId, choiceId });
  },

  async sendMessage(roomId: string, playerId: string, message: string) {
    return rpcCall<{ message: any }>('sendMessage', { roomId, playerId, message });
  },

  async getGameState(roomId: string) {
    return rpcCall<any>('getGameState', { roomId });
  },

  async listRooms() {
    return rpcCall<{ rooms: any[] }>('listRooms');
  },

  async listStories() {
    return rpcCall<{ stories: any[] }>('listStories');
  },

  async waitForEvents(roomId: string, lastEventId: number) {
    return rpcCall<{ events: any[]; lastEventId: number }>('waitForEvents', {
      roomId,
      lastEventId,
    });
  },

  async initiateDeleteRoom(roomId: string, playerId: string) {
    return rpcCall<{ success: boolean }>('initiateDeleteRoom', { roomId, playerId });
  },

  async voteDeleteRoom(roomId: string, playerId: string, vote: boolean) {
    return rpcCall<{ yesVotes: number; noVotes: number; total: number; approved: boolean }>('voteDeleteRoom', {
      roomId,
      playerId,
      vote,
    });
  },
};
