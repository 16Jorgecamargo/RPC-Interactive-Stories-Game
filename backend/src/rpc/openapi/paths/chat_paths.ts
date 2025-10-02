import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  SendMessageSchema,
  GetMessagesSchema,
  SendMessageResponseSchema,
  GetMessagesResponseSchema,
} from '../../../models/chat_schemas.js';

export function registerChatPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/chat/send',
    tags: ['Chat'],
    summary: 'Enviar mensagem no chat da sessão',
    description:
      'Envia uma mensagem de chat na sessão. A mensagem é sanitizada para evitar XSS. Validações: sessão existe, personagem pertence ao jogador e à sessão, sessão não está completada. As mensagens são armazenadas com timestamp e podem ser recuperadas via long polling.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SendMessageSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Mensagem enviada com sucesso',
        content: {
          'application/json': {
            schema: SendMessageResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - sessão completa ou personagem inválido',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/rpc/chat/messages',
    tags: ['Chat'],
    summary: 'Buscar mensagens do chat',
    description:
      'Retorna mensagens do chat da sessão. Suporta paginação via parâmetro limit e long polling via parâmetro since. Use since com o ID da última mensagem recebida para obter apenas mensagens novas. Validações: token válido, usuário é participante da sessão.',
    parameters: [
      {
        name: 'token',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'JWT token do jogador',
      },
      {
        name: 'sessionId',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'ID da sessão',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        description: 'Número máximo de mensagens a retornar',
      },
      {
        name: 'since',
        in: 'query',
        required: false,
        schema: { type: 'string', format: 'uuid' },
        description: 'ID da última mensagem recebida (retorna apenas mensagens posteriores)',
      },
    ],
    responses: {
      200: {
        description: 'Mensagens obtidas com sucesso',
        content: {
          'application/json': {
            schema: GetMessagesResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Usuário não é participante da sessão',
      },
    },
  });
}
