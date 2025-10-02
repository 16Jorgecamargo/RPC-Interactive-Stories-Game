import { z } from 'zod';
import * as updateService from '../../../services/update_service.js';
import {
  CheckGameUpdatesSchema,
  UpdatePlayerStatusSchema,
  CheckMessagesSchema,
} from '../../../models/update_schemas.js';

export const updateMethods = {
  checkGameUpdates: async (params: unknown) => {
    const validated = CheckGameUpdatesSchema.parse(params) as z.infer<typeof CheckGameUpdatesSchema>;
    return await updateService.checkGameUpdates(validated);
  },

  updatePlayerStatus: async (params: unknown) => {
    const validated = UpdatePlayerStatusSchema.parse(params) as z.infer<typeof UpdatePlayerStatusSchema>;
    return await updateService.updatePlayerStatus(validated);
  },

  checkMessages: async (params: unknown) => {
    const validated = CheckMessagesSchema.parse(params) as z.infer<typeof CheckMessagesSchema>;
    return await updateService.checkMessages(validated);
  },
};
