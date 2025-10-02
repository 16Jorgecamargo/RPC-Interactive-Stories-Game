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

type RpcMethod = (params: any) => Promise<any>;

export const storyMethods: Record<string, RpcMethod> = {
  createStory: async (params) => {
    const validated = CreateStorySchema.parse(params);
    return await storyService.createStory(validated);
  },

  uploadMermaid: async (params) => {
    const validated = UploadMermaidSchema.parse(params);
    return await storyService.uploadMermaid(validated);
  },

  listStories: async (params) => {
    const validated = GetStoriesSchema.parse(params);
    return await storyService.listAllStories(validated);
  },

  getStoryCatalog: async (params) => {
    const validated = GetStoryCatalogSchema.parse(params);
    return await storyService.getPublicCatalog(validated);
  },

  getStory: async (params) => {
    const validated = GetStorySchema.parse(params);
    return await storyService.getStory(validated);
  },

  updateStory: async (params) => {
    const validated = UpdateStorySchema.parse(params);
    return await storyService.updateStory(validated);
  },

  deleteStory: async (params) => {
    const validated = DeleteStorySchema.parse(params);
    return await storyService.deleteStory(validated);
  },

  toggleStoryStatus: async (params) => {
    const validated = ToggleStoryStatusSchema.parse(params);
    return await storyService.toggleStoryStatus(validated);
  },
};
