import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
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
  StorySchema,
  StoriesListSchema,
  PublicCatalogSchema,
  DeleteStoryResponseSchema,
  ToggleStoryStatusResponseSchema,
} from '../../../models/story_schemas.js';

export async function registerStoryWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories',
    schema: {
      tags: ['Stories'],
      summary: 'Criar nova história (Admin)',
      description:
        'Cria uma nova história a partir de código Mermaid. Apenas admins podem criar histórias. Internamente usa JSON-RPC 2.0 (method: "createStory").',
      body: CreateStorySchema,
    },
    handler: async (request, reply) => {
      const result = await storyService.createStory(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories/upload-mermaid',
    schema: {
      tags: ['Stories'],
      summary: 'Upload de arquivo Mermaid (Admin)',
      description:
        'Faz upload de conteúdo Mermaid e cria uma história. Apenas admins. Internamente usa JSON-RPC 2.0 (method: "uploadMermaid").',
      body: UploadMermaidSchema,
    },
    handler: async (request, reply) => {
      const result = await storyService.uploadMermaid(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories/list',
    schema: {
      tags: ['Stories'],
      summary: 'Listar todas as histórias (Admin)',
      description:
        'Retorna todas as histórias cadastradas, incluindo inativas. Apenas admins. Internamente usa JSON-RPC 2.0 (method: "listStories").',
      body: GetStoriesSchema,
    },
    handler: async (request, reply) => {
      const result = await storyService.listAllStories(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories/catalog',
    schema: {
      tags: ['Stories'],
      summary: 'Obter catálogo público de histórias',
      description:
        'Retorna apenas histórias ativas disponíveis para jogar. Acessível por todos os usuários autenticados. Internamente usa JSON-RPC 2.0 (method: "getStoryCatalog").',
      body: GetStoryCatalogSchema,
      response: {
        200: PublicCatalogSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await storyService.getPublicCatalog(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories/get',
    schema: {
      tags: ['Stories'],
      summary: 'Obter detalhes de uma história',
      description:
        'Retorna os detalhes completos de uma história específica. Internamente usa JSON-RPC 2.0 (method: "getStory").',
      body: GetStorySchema,
    },
    handler: async (request, reply) => {
      const result = await storyService.getStory(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/rpc/stories/update',
    schema: {
      tags: ['Stories'],
      summary: 'Atualizar história (Admin)',
      description:
        'Atualiza dados de uma história existente. Se mermaidSource for atualizado, reparse automático. Apenas admins. Internamente usa JSON-RPC 2.0 (method: "updateStory").',
      body: UpdateStorySchema,
    },
    handler: async (request, reply) => {
      const result = await storyService.updateStory(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/rpc/stories/delete',
    schema: {
      tags: ['Stories'],
      summary: 'Excluir história (Admin)',
      description:
        'Exclui permanentemente uma história. Apenas admins. Internamente usa JSON-RPC 2.0 (method: "deleteStory").',
      body: DeleteStorySchema,
      response: {
        200: DeleteStoryResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await storyService.deleteStory(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/stories/toggle-status',
    schema: {
      tags: ['Stories'],
      summary: 'Ativar/desativar história (Admin)',
      description:
        'Altera o status isActive de uma história. Histórias inativas não aparecem no catálogo público. Apenas admins. Internamente usa JSON-RPC 2.0 (method: "toggleStoryStatus").',
      body: ToggleStoryStatusSchema,
      response: {
        200: ToggleStoryStatusResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await storyService.toggleStoryStatus(request.body);
      return reply.send(result);
    },
  });
}
