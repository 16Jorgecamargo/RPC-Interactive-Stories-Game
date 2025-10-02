import { z } from 'zod';
import * as storyService from '../../../services/story_service.js';
import {
  CreateStorySchema,
  UploadMermaidSchema,
  GetStoriesSchema,
  GetStoryCatalogSchema,
  GetStorySchema,
  UpdateStorySchema,
  DeleteStorySchema,
  ToggleStoryStatusSchema,
} from '../../../models/story_schemas.js';

export const storyMethods = {
  createStory: async (params: unknown) => {
    const validated = CreateStorySchema.parse(params) as z.infer<typeof CreateStorySchema>;
    return await storyService.createStory(validated);
  },

  uploadMermaid: async (params: unknown) => {
    const validated = UploadMermaidSchema.parse(params) as z.infer<typeof UploadMermaidSchema>;
    return await storyService.uploadMermaid(validated);
  },

  listStories: async (params: unknown) => {
    const validated = GetStoriesSchema.parse(params) as z.infer<typeof GetStoriesSchema>;
    return await storyService.listAllStories(validated);
  },

  getStoryCatalog: async (params: unknown) => {
    const validated = GetStoryCatalogSchema.parse(params) as z.infer<typeof GetStoryCatalogSchema>;
    return await storyService.getPublicCatalog(validated);
  },

  getStory: async (params: unknown) => {
    const validated = GetStorySchema.parse(params) as z.infer<typeof GetStorySchema>;
    return await storyService.getStory(validated);
  },

  updateStory: async (params: unknown) => {
    const validated = UpdateStorySchema.parse(params) as z.infer<typeof UpdateStorySchema>;
    return await storyService.updateStory(validated);
  },

  deleteStory: async (params: unknown) => {
    const validated = DeleteStorySchema.parse(params) as z.infer<typeof DeleteStorySchema>;
    return await storyService.deleteStory(validated);
  },

  toggleStoryStatus: async (params: unknown) => {
    const validated = ToggleStoryStatusSchema.parse(params) as z.infer<typeof ToggleStoryStatusSchema>;
    return await storyService.toggleStoryStatus(validated);
  },
};
