import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as sessionService from '../../../services/session_service.js';
import {
  CreateSessionSchema,
  JoinSessionSchema,
  GetSessionsSchema,
  GetSessionDetailsSchema,
  DeleteSessionSchema,
  LeaveSessionSchema,
  CreateSessionResponseSchema,
  JoinSessionResponseSchema,
  SessionsListSchema,
  SessionDetailsResponseSchema,
  DeleteSessionResponseSchema,
  LeaveSessionResponseSchema,
  TransitionToCreatingCharactersSchema,
  CanStartSessionSchema,
  StartSessionSchema,
  TransitionResponseSchema,
  CanStartResponseSchema,
  StartSessionResponseSchema,
  EnterRoomSchema,
  LeaveRoomSchema,
  RoomActionResponseSchema,
} from '../../../models/session_schemas.js';

export async function registerSessionWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/create',
    schema: {
      tags: ['Sessions'],
      summary: 'Criar nova sessão de jogo',
      description:
        'Cria uma nova sessão de jogo vinculada a uma história. O criador automaticamente se torna o primeiro participante. Internamente usa JSON-RPC 2.0 (method: "createSession").',
      body: CreateSessionSchema,
      response: {
        200: CreateSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.createSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/join',
    schema: {
      tags: ['Sessions'],
      summary: 'Entrar em sessão via código',
      description:
        'Permite entrar em uma sessão existente usando o código de 6 caracteres. Valida limite de jogadores e se a sessão está aberta. Internamente usa JSON-RPC 2.0 (method: "joinSession").',
      body: JoinSessionSchema,
      response: {
        200: JoinSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.joinSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/list',
    schema: {
      tags: ['Sessions'],
      summary: 'Listar minhas sessões',
      description:
        'Retorna todas as sessões onde o usuário é participante, ordenadas por última atualização. Inclui informações da história. Internamente usa JSON-RPC 2.0 (method: "listMySessions").',
      body: GetSessionsSchema,
      response: {
        200: SessionsListSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.listMySessions(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/details',
    schema: {
      tags: ['Sessions'],
      summary: 'Obter detalhes de uma sessão',
      description:
        'Retorna informações completas sobre uma sessão específica. Apenas participantes podem visualizar. Internamente usa JSON-RPC 2.0 (method: "getSessionDetails").',
      body: GetSessionDetailsSchema,
      response: {
        200: SessionDetailsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.getSessionDetails(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/rpc/sessions/delete',
    schema: {
      tags: ['Sessions'],
      summary: 'Excluir sessão (owner only)',
      description:
        'Exclui permanentemente uma sessão. Apenas o criador da sessão pode realizar esta ação. Internamente usa JSON-RPC 2.0 (method: "deleteSession").',
      body: DeleteSessionSchema,
      response: {
        200: DeleteSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.deleteSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/leave',
    schema: {
      tags: ['Sessions'],
      summary: 'Sair de uma sessão',
      description:
        'Remove o participante de uma sessão. O owner não pode sair, apenas excluir a sessão. Internamente usa JSON-RPC 2.0 (method: "leaveSession").',
      body: LeaveSessionSchema,
      response: {
        200: LeaveSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.leaveSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/transition-to-creating-characters',
    schema: {
      tags: ['Sessions'],
      summary: 'Iniciar criação de personagens (owner only)',
      description:
        'Transiciona sessão de WAITING_PLAYERS para CREATING_CHARACTERS. Requer pelo menos 2 participantes. Internamente usa JSON-RPC 2.0 (method: "transitionToCreatingCharacters").',
      body: TransitionToCreatingCharactersSchema,
      response: {
        200: TransitionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.transitionToCreatingCharacters(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/can-start',
    schema: {
      tags: ['Sessions'],
      summary: 'Verificar se sessão pode iniciar',
      description:
        'Valida se todos os participantes criaram personagens e se a sessão está no estado correto. Internamente usa JSON-RPC 2.0 (method: "canStartSession").',
      body: CanStartSessionSchema,
      response: {
        200: CanStartResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.canStartSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/start',
    schema: {
      tags: ['Sessions'],
      summary: 'Iniciar jogo (owner only)',
      description:
        'Inicia o jogo, transicionando de CREATING_CHARACTERS para IN_PROGRESS. Bloqueia entrada de novos jogadores (isLocked=true). Internamente usa JSON-RPC 2.0 (method: "startSession").',
      body: StartSessionSchema,
      response: {
        200: StartSessionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.startSession(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/enter-room',
    schema: {
      tags: ['Sessions'],
      summary: 'Entrar na sala de espera',
      description:
        'Marca jogador como online e envia evento PLAYER_ROOM_JOINED + mensagem de chat. Use ao clicar no botão "Entrar na Sala" no /home. Internamente usa JSON-RPC 2.0 (method: "enterRoom").',
      body: EnterRoomSchema,
      response: {
        200: RoomActionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.enterRoom(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/sessions/leave-room',
    schema: {
      tags: ['Sessions'],
      summary: 'Sair da sala de espera (voltar à taverna)',
      description:
        'Marca jogador como offline e envia evento PLAYER_ROOM_LEFT + mensagem de chat. Use ao clicar no botão "Voltar para Taverna" na waiting-room. Internamente usa JSON-RPC 2.0 (method: "leaveRoom").',
      body: LeaveRoomSchema,
      response: {
        200: RoomActionResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await sessionService.leaveRoom(request.body);
      return reply.send(result);
    },
  });
}
