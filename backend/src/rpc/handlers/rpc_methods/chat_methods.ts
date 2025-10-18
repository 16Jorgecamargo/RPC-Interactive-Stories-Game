import { z } from 'zod';
import * as chatService from '../../../services/chat_service.js';
import {
  SendMessageSchema,
  GetMessagesSchema,
  SendRoomMessageSchema,
  GetRoomMessagesSchema,
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

  sendRoomMessage: async (params: unknown) => {
    const validated = SendRoomMessageSchema.parse(params) as z.infer<typeof SendRoomMessageSchema>;
    return await chatService.sendRoomMessage(validated);
  },

  getRoomMessages: async (params: unknown) => {
    const validated = GetRoomMessagesSchema.parse(params) as z.infer<typeof GetRoomMessagesSchema>;
    return await chatService.getRoomMessages(validated);
  },
};
