import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  CreateSessionSchema,
  JoinSessionSchema,
  GetSessionsSchema,
  GetSessionDetailsSchema,
  DeleteSessionSchema,
  LeaveSessionSchema,
  TransitionToCreatingCharactersSchema,
  CanStartSessionSchema,
  StartSessionSchema,
  CreateSessionResponseSchema,
  JoinSessionResponseSchema,
  SessionsListSchema,
  SessionDetailsResponseSchema,
  DeleteSessionResponseSchema,
  LeaveSessionResponseSchema,
  TransitionResponseSchema,
  CanStartResponseSchema,
  StartSessionResponseSchema,
} from '../../../models/session_schemas.js';

export function registerSessionPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/create',
    tags: ['Sessions'],
    summary: 'Criar nova sessão de jogo',
    description:
      'Cria uma nova sessão de jogo vinculada a uma história. O criador automaticamente se torna o primeiro participante. Wrapper REST que internamente chama o método RPC "createSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sessão criada com sucesso',
        content: {
          'application/json': {
            schema: CreateSessionResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/join',
    tags: ['Sessions'],
    summary: 'Entrar em sessão via código',
    description:
      'Permite entrar em uma sessão existente usando o código de 6 caracteres. Valida limite de jogadores e se a sessão está aberta. Wrapper REST que internamente chama o método RPC "joinSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: JoinSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Entrada na sessão realizada com sucesso',
        content: {
          'application/json': {
            schema: JoinSessionResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/list',
    tags: ['Sessions'],
    summary: 'Listar minhas sessões',
    description:
      'Retorna todas as sessões onde o usuário é participante, ordenadas por última atualização. Inclui informações da história. Wrapper REST que internamente chama o método RPC "listMySessions".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetSessionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Lista de sessões retornada com sucesso',
        content: {
          'application/json': {
            schema: SessionsListSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/details',
    tags: ['Sessions'],
    summary: 'Obter detalhes de uma sessão',
    description:
      'Retorna informações completas sobre uma sessão específica. Apenas participantes podem visualizar. Wrapper REST que internamente chama o método RPC "getSessionDetails".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetSessionDetailsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Detalhes da sessão retornados com sucesso',
        content: {
          'application/json': {
            schema: SessionDetailsResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/rpc/sessions/delete',
    tags: ['Sessions'],
    summary: 'Excluir sessão (owner only)',
    description:
      'Exclui permanentemente uma sessão. Apenas o criador da sessão pode realizar esta ação. Wrapper REST que internamente chama o método RPC "deleteSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DeleteSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sessão excluída com sucesso',
        content: {
          'application/json': {
            schema: DeleteSessionResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/leave',
    tags: ['Sessions'],
    summary: 'Sair de uma sessão',
    description:
      'Remove o participante de uma sessão. O owner não pode sair, apenas excluir a sessão. Wrapper REST que internamente chama o método RPC "leaveSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: LeaveSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Saída da sessão realizada com sucesso',
        content: {
          'application/json': {
            schema: LeaveSessionResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/transition-to-creating-characters',
    tags: ['Sessions'],
    summary: 'Iniciar criação de personagens (owner only)',
    description:
      'Transiciona sessão de WAITING_PLAYERS para CREATING_CHARACTERS. Requer pelo menos 2 participantes. Wrapper REST que internamente chama o método RPC "transitionToCreatingCharacters".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: TransitionToCreatingCharactersSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Transição realizada com sucesso',
        content: {
          'application/json': {
            schema: TransitionResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/can-start',
    tags: ['Sessions'],
    summary: 'Verificar se sessão pode iniciar',
    description:
      'Valida se todos os participantes criaram personagens e se a sessão está no estado correto. Wrapper REST que internamente chama o método RPC "canStartSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CanStartSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verificação realizada com sucesso',
        content: {
          'application/json': {
            schema: CanStartResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/sessions/start',
    tags: ['Sessions'],
    summary: 'Iniciar jogo (owner only)',
    description:
      'Inicia o jogo, transicionando de CREATING_CHARACTERS para IN_PROGRESS. Bloqueia entrada de novos jogadores (isLocked=true). Wrapper REST que internamente chama o método RPC "startSession".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StartSessionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sessão iniciada com sucesso',
        content: {
          'application/json': {
            schema: StartSessionResponseSchema,
          },
        },
      },
    },
  });
}
