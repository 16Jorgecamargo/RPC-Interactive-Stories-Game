import { z } from 'zod';
import * as chatService from '../../../services/chat_service.js';
import {
  SendMessageSchema,
  GetMessagesSchema,
} from '../../../models/chat_schemas.js';

export const chatMethods = {
  sendMessage: async (params: unknown) => {
    const validated = SendMessageSchema.parse(params) as z.infer<typeof SendMessageSchema>;
    return await chatService.sendMessage(validated);
  },

  getMessages: async (params: unknown) => {
    const validated = GetMessagesSchema.parse(params) as z.infer<typeof GetMessagesSchema>;
    return await chatService.getMessages(validated);
  },
};
