import { z } from 'zod';
import { ChatService } from '../../../services/chat_service.js';
import {
  SendMessageSchema,
  GetMessagesSchema,
  SendMessageResponseSchema,
  GetMessagesResponseSchema,
} from '../../../models/chat_schemas.js';
import { verifyToken } from '../../../utils/jwt.js';

const chatService = new ChatService();

export const chatMethods = {
  sendMessage: async (
    params: z.infer<typeof SendMessageSchema>
  ): Promise<z.infer<typeof SendMessageResponseSchema>> => {
    // Validar params com Zod
    const validated = SendMessageSchema.parse(params);
    const { token, sessionId, characterId, message } = validated;

    const decoded = verifyToken(token);
    if (!decoded) {
      throw {
        code: -32001,
        message: 'Token inválido ou expirado',
      };
    }

    try {
      return await chatService.sendMessage({ sessionId, characterId, message, token });
    } catch (error) {
      throw {
        code: -32002,
        message: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      };
    }
  },

  getMessages: async (
    params: z.infer<typeof GetMessagesSchema>
  ): Promise<z.infer<typeof GetMessagesResponseSchema>> => {
    // Validar params com Zod
    const validated = GetMessagesSchema.parse(params);
    const { token, sessionId, limit, since } = validated;

    const decoded = verifyToken(token);
    if (!decoded) {
      throw {
        code: -32001,
        message: 'Token inválido ou expirado',
      };
    }

    try {
      return await chatService.getMessages({ sessionId, limit, since, token });
    } catch (error) {
      throw {
        code: -32002,
        message: error instanceof Error ? error.message : 'Erro ao buscar mensagens',
      };
    }
  },
};
