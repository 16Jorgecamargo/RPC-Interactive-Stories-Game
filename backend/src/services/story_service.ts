import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../utils/jwt.js';
import { findById as findUserById } from '../stores/user_store.js';
import * as storyStore from '../stores/story_store.js';
import { parseMermaidToStory } from './mermaid_parser.js';
import {
  CreateStory,
  UploadMermaid,
  GetStories,
  GetStoryCatalog,
  GetStory,
  UpdateStory,
  DeleteStory,
  ToggleStoryStatus,
  Story,
  StoriesList,
  PublicCatalog,
  DeleteStoryResponse,
  ToggleStoryStatusResponse,
  PublicStoryInfo,
} from '../models/story_schemas.js';

function validateAdmin(token: string): string {
  const payload = verifyToken(token);
  const user = findUserById(payload.userId);

  if (!user) {
    throw {
      code: -32001,
      message: 'Usuário não encontrado',
    };
  }

  if (user.role !== 'ADMIN') {
    throw {
      code: -32002,
      message: 'Acesso negado: privilégios de administrador necessários',
    };
  }

  return user.id;
}

export async function createStory(params: CreateStory): Promise<Story> {
  const userId = validateAdmin(params.token);

  let parsedStory;
  try {
    parsedStory = parseMermaidToStory(params.mermaidSource);
  } catch (error: any) {
    throw {
      code: -32000,
      message: `Erro ao parsear código Mermaid: ${error.message}`,
      data: { details: error.message },
    };
  }

  const story: Story = {
    id: uuidv4(),
    title: params.title,
    description: params.description,
    metadata: params.metadata,
    mermaidSource: params.mermaidSource,
    capitulos: parsedStory.capitulos,
    initialChapter: parsedStory.initialChapter,
    isActive: true,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };

  return storyStore.createStory(story);
}

export async function uploadMermaid(params: UploadMermaid): Promise<Story> {
  const createParams: CreateStory = {
    token: params.token,
    title: params.title,
    description: params.description,
    metadata: params.metadata,
    mermaidSource: params.mermaidContent,
  };

  return await createStory(createParams);
}

export async function listAllStories(params: GetStories): Promise<StoriesList> {
  validateAdmin(params.token);

  const stories = storyStore.findAll();

  return {
    stories,
    total: stories.length,
  };
}

export async function getPublicCatalog(params: GetStoryCatalog): Promise<PublicCatalog> {
  if (params.token) {
    verifyToken(params.token);
  }

  const activeStories = storyStore.findActive();

  const publicStories: PublicStoryInfo[] = activeStories.map((story) => ({
    id: story.id,
    title: story.title,
    description: story.description,
    metadata: story.metadata,
    initialChapter: story.initialChapter,
    createdAt: story.createdAt,
    totalChapters: Object.keys(story.capitulos).length,
  }));

  return {
    stories: publicStories,
    total: publicStories.length,
  };
}

export async function getStory(params: GetStory): Promise<Story> {
  verifyToken(params.token);

  const story = storyStore.findById(params.storyId);

  if (!story) {
    throw {
      code: -32000,
      message: 'História não encontrada',
    };
  }

  return story;
}

export async function updateStory(params: UpdateStory): Promise<Story> {
  validateAdmin(params.token);

  const existingStory = storyStore.findById(params.storyId);

  if (!existingStory) {
    throw {
      code: -32000,
      message: 'História não encontrada',
    };
  }

  const updates: Partial<Story> = {};

  if (params.title !== undefined) {
    updates.title = params.title;
  }

  if (params.description !== undefined) {
    updates.description = params.description;
  }

  if (params.metadata !== undefined) {
    updates.metadata = params.metadata;
  }

  if (params.mermaidSource !== undefined) {
    try {
      const parsedStory = parseMermaidToStory(params.mermaidSource);
      updates.mermaidSource = params.mermaidSource;
      updates.capitulos = parsedStory.capitulos;
      updates.initialChapter = parsedStory.initialChapter;
    } catch (error: any) {
      throw {
        code: -32000,
        message: `Erro ao parsear novo código Mermaid: ${error.message}`,
        data: { details: error.message },
      };
    }
  }

  const updatedStory = storyStore.updateStory(params.storyId, updates);

  if (!updatedStory) {
    throw {
      code: -32000,
      message: 'Erro ao atualizar história',
    };
  }

  return updatedStory;
}

export async function deleteStory(params: DeleteStory): Promise<DeleteStoryResponse> {
  validateAdmin(params.token);

  const story = storyStore.findById(params.storyId);

  if (!story) {
    throw {
      code: -32000,
      message: 'História não encontrada',
    };
  }

  const success = storyStore.deleteStory(params.storyId);

  if (!success) {
    throw {
      code: -32000,
      message: 'Erro ao excluir história',
    };
  }

  return {
    success: true,
    message: 'História excluída com sucesso',
  };
}

export async function toggleStoryStatus(
  params: ToggleStoryStatus
): Promise<ToggleStoryStatusResponse> {
  validateAdmin(params.token);

  const story = storyStore.findById(params.storyId);

  if (!story) {
    throw {
      code: -32000,
      message: 'História não encontrada',
    };
  }

  const updatedStory = storyStore.updateStory(params.storyId, {
    isActive: params.isActive,
  });

  if (!updatedStory) {
    throw {
      code: -32000,
      message: 'Erro ao atualizar status da história',
    };
  }

  return {
    success: true,
    message: `História ${params.isActive ? 'ativada' : 'desativada'} com sucesso`,
    newStatus: params.isActive,
  };
}
