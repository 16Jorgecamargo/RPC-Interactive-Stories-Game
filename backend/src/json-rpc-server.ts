import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { JsonRpcRequest, JsonRpcResponse } from './types.js';
import {
  JsonRpcRequestSchema,
  CreateRoomParamsSchema,
  JoinRoomParamsSchema,
  LeaveRoomParamsSchema,
  VoteParamsSchema,
  SendMessageParamsSchema,
  GetGameStateParamsSchema,
  WaitForEventsParamsSchema,
  InitiateDeleteRoomParamsSchema,
  VoteDeleteRoomParamsSchema,
} from './types.js';
import { RoomManager } from './room-manager.js';
import { StoryManager } from './story-manager.js';
import { rpcLogger } from './logger.js';

export class JsonRpcServer {
  private roomManager: RoomManager;
  private storyManager: StoryManager;

  constructor() {
    this.storyManager = new StoryManager();
    this.roomManager = new RoomManager(this.storyManager);
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    let rpcRequest: JsonRpcRequest;

    try {
      // Validar estrutura JSON-RPC
      rpcRequest = JsonRpcRequestSchema.parse(request.body);
    } catch (error) {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: null,
      };
      return reply.code(200).send(response);
    }

    const { method, params, id: jsonrpcId } = rpcRequest;
    const reqId = typeof request.id === 'string' ? request.id : String(request.id);
    const requestLogger = rpcLogger.child({ method, reqId });
    const startedAt = Date.now();

    requestLogger.info({ jsonrpcId, hasParams: params !== undefined }, 'JSON-RPC request received');

    try {
      const result = await this.executeMethod(method, params);

      requestLogger.info({ jsonrpcId, durationMs: Date.now() - startedAt }, 'JSON-RPC request completed');

      // Se for uma notificação (sem jsonrpcId), não enviar resposta
      if (jsonrpcId === undefined) {
        return reply.code(204).send();
      }

      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        result,
        id: jsonrpcId,
      };
      return reply.code(200).send(response);
    } catch (error) {
      // Melhorar logging do erro
      const errorDetails = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { error: String(error) };

      requestLogger.error({ jsonrpcId, durationMs: Date.now() - startedAt, ...errorDetails }, `Erro ao executar método ${method}`);

      // Se for uma notificação, não enviar resposta mesmo com erro
      if (jsonrpcId === undefined) {
        return reply.code(204).send();
      }

      let code = -32603; // Internal error
      let message = 'Internal error';
      let data: any = undefined;

      if (error instanceof Error) {
        message = error.message;

        // Erros de validação
        if (error instanceof ZodError) {
          code = -32602; // Invalid params
          message = 'Invalid params';
          data = error.errors;
        }

        // Erros conhecidos
        if (message.includes('not found')) {
          code = -32001; // Custom: Not found
        } else if (message.includes('Invalid')) {
          code = -32602; // Invalid params
        }
      }

      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        error: { code, message, data },
        id: jsonrpcId,
      };
      return reply.code(200).send(response);
    }
  }

  private async executeMethod(method: string, params: any): Promise<any> {
    switch (method) {
      case 'createRoom': {
        const validated = CreateRoomParamsSchema.parse(params);
        return this.roomManager.createRoom(validated);
      }

      case 'joinRoom': {
        const validated = JoinRoomParamsSchema.parse(params);
        return this.roomManager.joinRoom(validated);
      }

      case 'leaveRoom': {
        const validated = LeaveRoomParamsSchema.parse(params);
        this.roomManager.leaveRoom(validated.roomId, validated.playerId);
        return { success: true };
      }

      case 'vote': {
        const validated = VoteParamsSchema.parse(params);
        return this.roomManager.vote(validated);
      }

      case 'sendMessage': {
        const validated = SendMessageParamsSchema.parse(params);
        return this.roomManager.sendMessage(validated);
      }

      case 'getGameState': {
        const validated = GetGameStateParamsSchema.parse(params);
        return this.roomManager.getGameState(validated.roomId);
      }

      case 'listRooms': {
        return { rooms: this.roomManager.listRooms() };
      }

      case 'listStories': {
        const stories = this.storyManager.getAllStories().map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
        }));
        return { stories };
      }

      case 'waitForEvents': {
        const validated = WaitForEventsParamsSchema.parse(params);
        return await this.roomManager.waitForEvents(validated.roomId, validated.lastEventId);
      }

      case 'initiateDeleteRoom': {
        const validated = InitiateDeleteRoomParamsSchema.parse(params);
        return this.roomManager.initiateDeleteRoom(validated);
      }

      case 'voteDeleteRoom': {
        const validated = VoteDeleteRoomParamsSchema.parse(params);
        return this.roomManager.voteDeleteRoom(validated);
      }

      default:
        throw new Error(`Method not found: ${method}`);
    }
  }
}
