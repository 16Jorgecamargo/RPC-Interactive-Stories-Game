import { nanoid } from 'nanoid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  Room,
  Player,
  Vote,
  ChatMessage,
  GameEvent,
  CreateRoomParams,
  JoinRoomParams,
  VoteParams,
  SendMessageParams,
  Choice,
  InitiateDeleteRoomParams,
  VoteDeleteRoomParams,
  DeleteRoomVote,
} from './types.js';
import { StoryManager } from './story-manager.js';
import { roomLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private storyManager: StoryManager;
  private pendingRequests: Map<string, Set<PendingRequest>> = new Map();
  private roomsDir: string;
  private roomsFilePath: string;
  private roomLogBuffers: Map<string, RoomLogBuffer> = new Map();
  private voteCountdowns: Map<string, CountdownTracker> = new Map();
  private cardCountdowns: Map<string, CardCountdownTracker> = new Map();

  constructor(storyManager: StoryManager) {
    this.storyManager = storyManager;
    this.roomsDir = join(__dirname, '..', 'data');
    this.roomsFilePath = join(this.roomsDir, 'rooms.json');
    this.ensureStorageFile();
    this.loadRoomsFromStorage();
  }

  createRoom(params: CreateRoomParams): { roomId: string } {
    const story = this.storyManager.getStory(params.storyId);
    if (!story) {
      throw new Error(`Story ${params.storyId} not found`);
    }

    if (story.cards.length === 0) {
      throw new Error('Story has no cards');
    }

    const roomId = nanoid(10);
    const room: Room = {
      id: roomId,
      name: params.name,
      storyId: params.storyId,
      currentCardId: story.cards[0].id,
      players: new Map(),
      votes: new Map(),
      messages: [],
      createdAt: Date.now(),
      events: [],
      eventIdCounter: 0,
    };

    this.rooms.set(roomId, room);
    this.persistRooms();
    roomLogger.info({ roomId, roomName: params.name, storyId: params.storyId }, `Sala criada: ${params.name}`);
    return { roomId };
  }

  joinRoom(params: JoinRoomParams): { playerId: string; gameState: any } {
    const room = this.rooms.get(params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const playerId = nanoid(10);
    const player: Player = {
      id: playerId,
      name: params.playerName,
      joinedAt: Date.now(),
    };

    room.players.set(playerId, player);

    // Adicionar evento de jogador entrou
    this.addEvent(room, {
      type: 'playerJoined',
      data: { playerId, playerName: params.playerName },
    });

    // Adicionar mensagem do sistema no chat
    this.addSystemMessage(room, `${params.playerName} entrou na sala`);

    this.recordRoomActivity(room, 'playerJoined', {
      playerId,
      playerName: params.playerName,
    });

    return {
      playerId,
      gameState: this.getGameState(params.roomId),
    };
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(playerId);
    if (player) {
      room.players.delete(playerId);
      room.votes.delete(playerId);

      // Remover voto de exclusão se existir
      if (room.deleteRoomVotes) {
        room.deleteRoomVotes.delete(playerId);
      }

      this.addEvent(room, {
        type: 'playerLeft',
        data: { playerId, playerName: player.name },
      });

      // Adicionar mensagem do sistema no chat
      this.addSystemMessage(room, `${player.name} saiu da sala`);

      this.recordRoomActivity(room, 'playerLeft', {
        playerId,
        playerName: player.name,
      });

      if (room.players.size === 0) {
        room.deleteRoomVotes = undefined;
        room.deleteRoomInitiatedAt = undefined;
        room.votes.clear();
        this.clearVoteCountdown(roomId, 'roomEmpty');
        this.clearCardCountdown(roomId, 'roomEmpty');
        this.flushRoomActivity(roomId, { reason: 'Sala ficou vazia' });
      }
    }
  }

  vote(params: VoteParams): { voteCount: Record<string, number> } {
    const room = this.rooms.get(params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(params.playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    // Verificar se a escolha é válida para o card atual
    const card = this.storyManager.getCard(room.storyId, room.currentCardId);
    if (!card) {
      throw new Error('Current card not found');
    }

    const validChoice = card.choices.find((c: Choice) => c.id === params.choiceId);
    if (!validChoice) {
      throw new Error('Invalid choice for current card');
    }

    // Registrar voto
    const vote: Vote = {
      playerId: params.playerId,
      choiceId: params.choiceId,
      timestamp: Date.now(),
    };

    room.votes.set(params.playerId, vote);

    this.addEvent(room, {
      type: 'vote',
      data: {
        playerId: params.playerId,
        playerName: player.name,
        choiceId: params.choiceId,
      },
    });

    this.recordRoomActivity(room, 'vote', {
      playerId: params.playerId,
      playerName: player.name,
      choiceId: params.choiceId,
    });

    const voteCount = this.getVoteCount(room);

    if (room.players.size <= 1) {
      this.finalizeVoting(room.id, 'singlePlayer');
    } else {
      this.startVoteCountdown(room, 15000);

      if (room.votes.size === room.players.size && room.players.size > 0) {
        this.finalizeVoting(room.id, 'allVoted');
      }
    }

    return { voteCount };
  }

  sendMessage(params: SendMessageParams): { message: ChatMessage } {
    const room = this.rooms.get(params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(params.playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    const message: ChatMessage = {
      id: nanoid(10),
      playerId: params.playerId,
      playerName: player.name,
      message: params.message,
      timestamp: Date.now(),
    };

    room.messages.push(message);

    this.addEvent(room, {
      type: 'message',
      data: message,
    });

    this.recordRoomActivity(room, 'message', {
      playerId: params.playerId,
      playerName: player.name,
    });

    return { message };
  }

  getGameState(roomId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const card = this.storyManager.getCard(room.storyId, room.currentCardId);
    const story = this.storyManager.getStory(room.storyId);

    const voteCount = this.getVoteCount(room);

    return {
      room: {
        id: room.id,
        name: room.name,
        storyId: room.storyId,
        storyTitle: story?.title,
      },
      currentCard: card,
      players: Array.from(room.players.values()),
      votes: voteCount,
      playerVoted: Array.from(room.votes.keys()),
      messages: room.messages.slice(-50), // Últimas 50 mensagens
      lastEventId: room.eventIdCounter - 1,
      countdowns: this.getCountdownState(room.id),
    };
  }

  listRooms(): Array<{ id: string; name: string; playerCount: number; storyTitle: string }> {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.size,
      storyTitle: this.storyManager.getStory(room.storyId)?.title || 'Unknown',
    }));
  }

  waitForEvents(roomId: string, lastEventId: number, timeout: number = 30000): Promise<{
    events: GameEvent[];
    lastEventId: number;
  }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verificar se já tem eventos novos
    const newEvents = room.events.filter((e) => e.id > lastEventId);
    if (newEvents.length > 0) {
      return Promise.resolve({
        events: newEvents,
        lastEventId: room.eventIdCounter - 1,
      });
    }

    // Long polling: esperar por novos eventos
    return new Promise((resolve) => {
      const request: PendingRequest = {
        resolve,
        lastEventId,
        timeout: setTimeout(() => {
          this.removePendingRequest(roomId, request);
          // Verificar se a sala ainda existe antes de acessar
          const currentRoom = this.rooms.get(roomId);
          resolve({
            events: [],
            lastEventId: currentRoom ? currentRoom.eventIdCounter - 1 : lastEventId,
          });
        }, timeout),
      };

      if (!this.pendingRequests.has(roomId)) {
        this.pendingRequests.set(roomId, new Set());
      }
      this.pendingRequests.get(roomId)!.add(request);
    });
  }

  private finalizeVoting(roomId: string, reason: CountdownCompletionReason): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const card = this.storyManager.getCard(room.storyId, room.currentCardId);
    if (!card) {
      return;
    }

    if (this.cardCountdowns.has(roomId)) {
      return;
    }

    this.clearVoteCountdown(roomId, reason);

    if (room.votes.size === 0) {
      return;
    }

    const winningChoice = this.getWinningChoice(room, card.choices.map((c: Choice) => c.id));
    if (!winningChoice) {
      return;
    }

    const choice = card.choices.find((c: Choice) => c.id === winningChoice);
    if (!choice) {
      return;
    }

    this.startCardCountdown(room, choice.nextCard, 3000, reason);
  }

  private startVoteCountdown(room: Room, durationMs: number): void {
    if (room.players.size <= 1 || this.voteCountdowns.has(room.id)) {
      return;
    }

    const startedAt = Date.now();
    const timeout = setTimeout(() => {
      this.finalizeVoting(room.id, 'timeout');
    }, durationMs);

    this.voteCountdowns.set(room.id, { timeout, startedAt, durationMs });
    this.addEvent(room, {
      type: 'countdownStarted',
      data: { countdownType: 'vote', durationMs, startedAt },
    });
  }

  private startCardCountdown(room: Room, newCardId: string, durationMs: number, _reason: CountdownCompletionReason): void {
    if (this.cardCountdowns.has(room.id)) {
      this.clearCardCountdown(room.id, 'cancelled');
    }

    const startedAt = Date.now();
    const timeout = setTimeout(() => {
      this.cardCountdowns.delete(room.id);
      this.emitCountdownFinished(room.id, 'card', 'completed');
      const currentRoom = this.rooms.get(room.id);
      if (currentRoom) {
        this.changeCard(currentRoom, newCardId);
      }
    }, durationMs);

    this.cardCountdowns.set(room.id, { timeout, startedAt, durationMs, targetCardId: newCardId });
    this.addEvent(room, {
      type: 'countdownStarted',
      data: { countdownType: 'card', durationMs, startedAt },
    });
  }

  private clearVoteCountdown(roomId: string, reason?: CountdownCompletionReason): void {
    const tracker = this.voteCountdowns.get(roomId);
    if (!tracker) {
      return;
    }

    clearTimeout(tracker.timeout);
    this.voteCountdowns.delete(roomId);
    this.emitCountdownFinished(roomId, 'vote', reason);
  }

  private clearCardCountdown(roomId: string, reason?: CountdownCompletionReason): void {
    const tracker = this.cardCountdowns.get(roomId);
    if (!tracker) {
      return;
    }

    clearTimeout(tracker.timeout);
    this.cardCountdowns.delete(roomId);
    this.emitCountdownFinished(roomId, 'card', reason);
  }

  private emitCountdownFinished(roomId: string, countdownType: CountdownType, reason?: CountdownCompletionReason): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    this.addEvent(room, {
      type: 'countdownFinished',
      data: { countdownType, reason },
    });
  }

  private getCountdownState(roomId: string): CountdownState[] {
    const countdowns: CountdownState[] = [];
    const vote = this.voteCountdowns.get(roomId);
    if (vote) {
      countdowns.push({
        countdownType: 'vote',
        durationMs: vote.durationMs,
        startedAt: vote.startedAt,
      });
    }

    const card = this.cardCountdowns.get(roomId);
    if (card) {
      countdowns.push({
        countdownType: 'card',
        durationMs: card.durationMs,
        startedAt: card.startedAt,
      });
    }

    return countdowns;
  }

  private recordRoomActivity(room: Room, type: RoomActivityType, data: any, flushImmediately: boolean = false): void {
    let buffer = this.roomLogBuffers.get(room.id);
    if (!buffer) {
      buffer = { events: [] };
      this.roomLogBuffers.set(room.id, buffer);
    }

    buffer.events.push({ type, data, at: Date.now() });

    if (flushImmediately) {
      this.flushRoomActivity(room.id);
      return;
    }

    if (!buffer.timeout) {
      buffer.timeout = setTimeout(() => {
        this.flushRoomActivity(room.id);
      }, 2000);
    }
  }

  private flushRoomActivity(roomId: string, options: { reason?: string } = {}): void {
    const buffer = this.roomLogBuffers.get(roomId);
    if (buffer?.timeout) {
      clearTimeout(buffer.timeout);
    }
    this.roomLogBuffers.delete(roomId);

    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const events = buffer?.events ?? [];
    if (events.length === 0 && !options.reason) {
      return;
    }

    const { segments, context } = this.buildRoomActivityDetails(events);
    const summary = this.composeRoomActivitySummary(room, segments, options.reason);

    const logContext: Record<string, any> = {
      roomId: room.id,
      roomName: room.name,
      storyId: room.storyId,
      playerCount: room.players.size,
      ...context,
    };

    if (options.reason) {
      logContext.reason = options.reason;
    }

    roomLogger.info(logContext, summary);
  }

  private buildRoomActivityDetails(events: BufferedRoomEvent[]): { segments: string[]; context: Record<string, any> } {
    const segments: string[] = [];
    const context: Record<string, any> = {};

    if (events.length === 0) {
      return { segments, context };
    }

    const joined: string[] = [];
    const left: string[] = [];
    const messageCounts = new Map<string, number>();
    let totalMessages = 0;
    const voteCounts = new Map<string, number>();
    let totalVotes = 0;
    const cardChanges: string[] = [];
    let deleteInitiator: string | undefined;
    let deleteVoteSnapshot: {
      yesVotes: number;
      noVotes: number;
      total: number;
      lastVote?: boolean;
      lastVoter?: string;
    } | undefined;
    let deleteExpired = false;
    let deleteRejected = false;

    events.forEach((event) => {
      switch (event.type) {
        case 'playerJoined':
          if (event.data.playerName) {
            joined.push(event.data.playerName);
          }
          break;
        case 'playerLeft':
          if (event.data.playerName) {
            left.push(event.data.playerName);
          }
          break;
        case 'message':
          totalMessages++;
          if (event.data.playerName) {
            messageCounts.set(
              event.data.playerName,
              (messageCounts.get(event.data.playerName) ?? 0) + 1
            );
          }
          break;
        case 'vote':
          totalVotes++;
          if (event.data.choiceId) {
            voteCounts.set(event.data.choiceId, (voteCounts.get(event.data.choiceId) ?? 0) + 1);
          }
          break;
        case 'deleteRoomInitiated':
          deleteInitiator = event.data.playerName;
          break;
        case 'deleteRoomVote':
          deleteVoteSnapshot = {
            yesVotes: event.data.yesVotes,
            noVotes: event.data.noVotes,
            total: event.data.total,
            lastVote: event.data.vote,
            lastVoter: event.data.playerName,
          };
          break;
        case 'deleteRoomExpired':
          deleteExpired = true;
          break;
        case 'deleteRoomRejected':
          deleteRejected = true;
          break;
        case 'systemMessage':
          // Ignorar mensagens do sistema no resumo para evitar ruído adicional
          break;
        case 'cardChanged':
          if (event.data.newCardId) {
            cardChanges.push(event.data.newCardId);
          }
          break;
        default:
          break;
      }
    });

    if (joined.length > 0) {
      const label = joined.length === 1 ? 'jogador entrou' : 'jogadores entraram';
      segments.push(`+${joined.length} ${label}: ${joined.join(', ')}`);
      context.playersJoined = joined;
    }

    if (left.length > 0) {
      const label = left.length === 1 ? 'jogador saiu' : 'jogadores saíram';
      segments.push(`-${left.length} ${label}: ${left.join(', ')}`);
      context.playersLeft = left;
    }

    if (totalMessages > 0) {
      const label = totalMessages === 1 ? 'mensagem' : 'mensagens';
      const messageParts = Array.from(messageCounts.entries()).map(
        ([name, count]) => `${name} x${count}`
      );
      segments.push(`${totalMessages} ${label} no chat${messageParts.length ? ` (${messageParts.join(', ')})` : ''}`);
      context.messages = {
        total: totalMessages,
        byPlayer: Object.fromEntries(messageCounts),
      };
    }

    if (cardChanges.length > 0) {
      const uniqueCards = Array.from(new Set(cardChanges));
      const label = uniqueCards.length === 1 ? 'card' : 'cards';
      segments.push(`Avanço de ${label}: ${uniqueCards.join(', ')}`);
      context.cardChanges = uniqueCards;
    }

    if (totalVotes > 0) {
      const label = totalVotes === 1 ? 'voto' : 'votos';
      const voteParts = Array.from(voteCounts.entries()).map(
        ([choiceId, count]) => `${choiceId}: ${count}`
      );
      segments.push(`${totalVotes} ${label} registrados${voteParts.length ? ` (${voteParts.join(', ')})` : ''}`);
      context.votes = {
        total: totalVotes,
        byChoice: Object.fromEntries(voteCounts),
      };
    }

    const deleteContext: Record<string, any> = {};
    if (deleteInitiator) {
      segments.push(`Votação de exclusão iniciada por ${deleteInitiator}`);
      deleteContext.initiatedBy = deleteInitiator;
    }

    if (deleteVoteSnapshot) {
      const { yesVotes, noVotes, total, lastVoter, lastVote } = deleteVoteSnapshot;
      const parts = [`${yesVotes}/${total} votos SIM`, `${noVotes} votos NÃO`];
      if (lastVoter) {
        parts.push(`último voto: ${lastVoter} (${lastVote ? 'SIM' : 'NÃO'})`);
      }
      segments.push(`Andamento da exclusão: ${parts.join(' • ')}`);
      deleteContext.progress = {
        yesVotes,
        noVotes,
        total,
        lastVoter,
        lastVote,
      };
    }

    if (deleteExpired) {
      segments.push('Votação de exclusão expirou');
      deleteContext.expired = true;
    }

    if (deleteRejected) {
      segments.push('Votação de exclusão rejeitada');
      deleteContext.rejected = true;
    }

    if (Object.keys(deleteContext).length > 0) {
      context.deleteRoom = deleteContext;
    }

    return { segments, context };
  }

  private composeRoomActivitySummary(room: Room, segments: string[], reason?: string): string {
    const parts = [...segments];
    if (reason) {
      parts.push(reason);
    }
    const body = parts.length > 0 ? parts.join(' | ') : 'Nenhuma atividade recente.';
    return `Sala ${room.name} (${room.id}): ${body}`;
  }

  private loadRoomsFromStorage(): void {
    try {
      if (!existsSync(this.roomsFilePath)) {
        return;
      }

      const rawData = readFileSync(this.roomsFilePath, 'utf-8');
      if (!rawData.trim()) {
        return;
      }

      const persistedRooms = JSON.parse(rawData) as PersistedRoom[];
      persistedRooms.forEach((persistedRoom) => {
        const storyExists = this.storyManager.getStory(persistedRoom.storyId);
        if (!storyExists) {
          roomLogger.warn({ roomId: persistedRoom.id, storyId: persistedRoom.storyId }, 'Ignorando sala sem história válida ao carregar do storage');
          return;
        }

        const hydrated = this.hydrateRoom(persistedRoom);
        this.rooms.set(hydrated.id, hydrated);
      });

      if (this.rooms.size > 0) {
        roomLogger.info({ count: this.rooms.size }, 'Salas carregadas do storage');
        // Regravar para garantir compatibilidade com formato mais recente
        this.persistRooms();
      }
    } catch (error) {
      roomLogger.error({ error }, 'Erro ao carregar salas do storage');
    }
  }

  private ensureStorageFile(): void {
    try {
      if (!existsSync(this.roomsDir)) {
        mkdirSync(this.roomsDir, { recursive: true });
      }

      if (!existsSync(this.roomsFilePath)) {
        writeFileSync(this.roomsFilePath, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch (error) {
      roomLogger.error({ error }, 'Erro ao preparar storage de salas');
    }
  }

  private persistRooms(): void {
    try {
      if (!existsSync(this.roomsDir)) {
        mkdirSync(this.roomsDir, { recursive: true });
      }

      const data = Array.from(this.rooms.values()).map((room) => this.serializeRoom(room));
      writeFileSync(this.roomsFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      roomLogger.error({ error }, 'Erro ao salvar salas no storage');
    }
  }

  private serializeRoom(room: Room): PersistedRoom {
    return {
      id: room.id,
      name: room.name,
      storyId: room.storyId,
      currentCardId: room.currentCardId,
      createdAt: room.createdAt,
    };
  }

  private hydrateRoom(persisted: PersistedRoom): Room {
    return {
      id: persisted.id,
      name: persisted.name,
      storyId: persisted.storyId,
      currentCardId: persisted.currentCardId,
      players: new Map(), // Sempre vazio ao carregar
      votes: new Map(),   // Sempre vazio ao carregar
      messages: [],       // Sempre vazio ao carregar
      createdAt: persisted.createdAt,
      events: [],
      eventIdCounter: 0,
      deleteRoomVotes: undefined,
      deleteRoomInitiatedAt: undefined,
    };
  }

  private addEvent(room: Room, event: Omit<GameEvent, 'id'>): void {
    const eventWithId: GameEvent = {
      ...event,
      id: room.eventIdCounter++,
    } as GameEvent;

    room.events.push(eventWithId);

    // Limitar eventos armazenados (manter últimos 100)
    if (room.events.length > 100) {
      room.events = room.events.slice(-100);
    }

    // Notificar requests pendentes
    const pending = this.pendingRequests.get(room.id);
    if (pending) {
      pending.forEach((request) => {
        if (eventWithId.id > request.lastEventId) {
          clearTimeout(request.timeout);
          const newEvents = room.events.filter((e) => e.id > request.lastEventId);
          request.resolve({
            events: newEvents,
            lastEventId: room.eventIdCounter - 1,
          });
        }
      });
      this.pendingRequests.delete(room.id);
    }

    this.persistRooms();
  }

  private removePendingRequest(roomId: string, request: PendingRequest): void {
    const pending = this.pendingRequests.get(roomId);
    if (pending) {
      pending.delete(request);
      if (pending.size === 0) {
        this.pendingRequests.delete(roomId);
      }
    }
  }

  private getVoteCount(room: Room): Record<string, number> {
    const voteCount: Record<string, number> = {};
    room.votes.forEach((vote) => {
      voteCount[vote.choiceId] = (voteCount[vote.choiceId] || 0) + 1;
    });
    return voteCount;
  }

  private getWinningChoice(room: Room, validChoices: string[]): string | null {
    const voteCount = this.getVoteCount(room);
    let maxVotes = 0;
    let winner: string | null = null;

    validChoices.forEach((choiceId) => {
      const votes = voteCount[choiceId] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = choiceId;
      }
    });

    return winner;
  }

  private changeCard(room: Room, newCardId: string): void {
    room.currentCardId = newCardId;
    room.votes.clear();

    this.addEvent(room, {
      type: 'cardChanged',
      data: { newCardId },
    });

    this.recordRoomActivity(room, 'cardChanged', { newCardId });
  }

  private addSystemMessage(room: Room, message: string): void {
    const systemMessage: ChatMessage = {
      id: nanoid(10),
      playerId: 'system',
      playerName: 'Sistema',
      message,
      timestamp: Date.now(),
      isSystem: true,
    };

    room.messages.push(systemMessage);

    this.addEvent(room, {
      type: 'message',
      data: systemMessage,
    });
  }

  initiateDeleteRoom(params: InitiateDeleteRoomParams): { success: boolean } {
    const room = this.rooms.get(params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(params.playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    // Verificar se já existe uma votação em andamento
    if (room.deleteRoomVotes && room.deleteRoomInitiatedAt) {
      const timeSinceInitiated = Date.now() - room.deleteRoomInitiatedAt;
      if (timeSinceInitiated < 60000) { // 60 segundos
        throw new Error('Uma votação para deletar a sala já está em andamento');
      }
    }

    // Iniciar votação
    room.deleteRoomVotes = new Map();
    room.deleteRoomInitiatedAt = Date.now();

    this.addEvent(room, {
      type: 'deleteRoomInitiated',
      data: { playerId: params.playerId, playerName: player.name },
    });

    this.addSystemMessage(room, `${player.name} iniciou uma votação para deletar a sala. Vote em até 60 segundos!`);

    this.recordRoomActivity(room, 'deleteRoomInitiated', {
      playerId: params.playerId,
      playerName: player.name,
    });

    // Auto-cancelar após 60 segundos se não atingir 75%
    setTimeout(() => {
      this.checkDeleteRoomVotes(params.roomId);
    }, 60000);

    return { success: true };
  }

  voteDeleteRoom(params: VoteDeleteRoomParams): { yesVotes: number; noVotes: number; total: number; approved: boolean } {
    const room = this.rooms.get(params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(params.playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    if (!room.deleteRoomVotes || !room.deleteRoomInitiatedAt) {
      throw new Error('Não há votação para deletar sala em andamento');
    }

    // Verificar se a votação expirou
    const timeSinceInitiated = Date.now() - room.deleteRoomInitiatedAt;
    if (timeSinceInitiated > 60000) {
      throw new Error('A votação expirou');
    }

    // Registrar voto
    const vote: DeleteRoomVote = {
      playerId: params.playerId,
      vote: params.vote,
      timestamp: Date.now(),
    };

    room.deleteRoomVotes.set(params.playerId, vote);

    // Contar votos
    let yesVotes = 0;
    let noVotes = 0;

    room.deleteRoomVotes.forEach((v) => {
      if (v.vote) yesVotes++;
      else noVotes++;
    });

    const total = room.players.size;
    const percentage = (yesVotes / total) * 100;

    this.addEvent(room, {
      type: 'deleteRoomVoted',
      data: {
        playerId: params.playerId,
        playerName: player.name,
        vote: params.vote,
        yesVotes,
        noVotes,
        total,
      },
    });
    this.recordRoomActivity(room, 'deleteRoomVote', {
      playerId: params.playerId,
      playerName: player.name,
      vote: params.vote,
      yesVotes,
      noVotes,
      total,
    });

    // Verificar se atingiu 75%
    if (percentage >= 75 && yesVotes + noVotes === total) {
      this.deleteRoom(params.roomId, 'Aprovado por votação (75% ou mais)');
      return { yesVotes, noVotes, total, approved: true };
    }

    // Verificar se é impossível atingir 75%
    const remainingVotes = total - (yesVotes + noVotes);
    const maxPossibleYes = yesVotes + remainingVotes;
    const maxPossiblePercentage = (maxPossibleYes / total) * 100;

    if (maxPossiblePercentage < 75) {
      this.addSystemMessage(room, 'A votação para deletar a sala foi rejeitada.');
      room.deleteRoomVotes = undefined;
      room.deleteRoomInitiatedAt = undefined;
      this.recordRoomActivity(room, 'deleteRoomRejected', {
        yesVotes,
        noVotes,
        total,
      }, true);
      this.persistRooms();
    }

    return { yesVotes, noVotes, total, approved: false };
  }

  private checkDeleteRoomVotes(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.deleteRoomVotes || !room.deleteRoomInitiatedAt) {
      return;
    }

    // Contar votos
    let yesVotes = 0;
    room.deleteRoomVotes.forEach((v) => {
      if (v.vote) yesVotes++;
    });

    const total = room.players.size;
    const percentage = (yesVotes / total) * 100;

    if (percentage >= 75) {
      this.deleteRoom(roomId, 'Aprovado por votação (75% ou mais)');
    } else {
      this.addSystemMessage(room, 'A votação para deletar a sala expirou sem atingir 75% de aprovação.');
      room.deleteRoomVotes = undefined;
      room.deleteRoomInitiatedAt = undefined;
      this.recordRoomActivity(room, 'deleteRoomExpired', {
        yesVotes,
        total,
      }, true);
      this.persistRooms();
    }
  }

  private deleteRoom(roomId: string, reason: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    this.clearVoteCountdown(roomId, 'roomDeleted');
    this.clearCardCountdown(roomId, 'roomDeleted');

    this.addEvent(room, {
      type: 'roomDeleted',
      data: { reason },
    });

    this.addSystemMessage(room, `A sala foi deletada: ${reason}`);

    // Notificar todos os pending requests antes de deletar
    const pending = this.pendingRequests.get(roomId);
    if (pending) {
      pending.forEach((request) => {
        clearTimeout(request.timeout);
        const newEvents = room.events.filter((e) => e.id > request.lastEventId);
        request.resolve({
          events: newEvents,
          lastEventId: room.eventIdCounter - 1,
        });
      });
      this.pendingRequests.delete(roomId);
    }

    this.flushRoomActivity(roomId, { reason: `Sala deletada (${reason})` });

    // Aguardar um pouco para enviar os eventos antes de deletar
    setTimeout(() => {
      this.rooms.delete(roomId);
      this.persistRooms();
    }, 2000);
  }
}

interface PendingRequest {
  resolve: (value: { events: GameEvent[]; lastEventId: number }) => void;
  lastEventId: number;
  timeout: NodeJS.Timeout;
}

type RoomActivityType =
  | 'playerJoined'
  | 'playerLeft'
  | 'vote'
  | 'message'
  | 'systemMessage'
  | 'cardChanged'
  | 'deleteRoomInitiated'
  | 'deleteRoomVote'
  | 'deleteRoomExpired'
  | 'deleteRoomRejected';

interface BufferedRoomEvent {
  type: RoomActivityType;
  data: any;
  at: number;
}

interface RoomLogBuffer {
  events: BufferedRoomEvent[];
  timeout?: NodeJS.Timeout;
}

type CountdownType = 'vote' | 'card';

type CountdownCompletionReason =
  | 'timeout'
  | 'allVoted'
  | 'singlePlayer'
  | 'completed'
  | 'cancelled'
  | 'roomDeleted'
  | 'roomEmpty';

interface CountdownTracker {
  timeout: NodeJS.Timeout;
  startedAt: number;
  durationMs: number;
}

interface CardCountdownTracker extends CountdownTracker {
  targetCardId: string;
}

interface CountdownState {
  countdownType: CountdownType;
  durationMs: number;
  startedAt: number;
}

type PersistedRoom = {
  id: string;
  name: string;
  storyId: string;
  currentCardId: string;
  createdAt: number;
};
