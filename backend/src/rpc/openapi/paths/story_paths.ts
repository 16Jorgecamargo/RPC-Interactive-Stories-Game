import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
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

export function registerStoryPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/stories',
    tags: ['Stories'],
    summary: 'Criar nova história (Admin)',
    description:
      'Cria uma nova história a partir de código Mermaid. Apenas admins podem criar histórias. Wrapper REST que internamente chama o método RPC "createStory".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateStorySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'História criada com sucesso',
        content: {
          'application/json': {
            schema: StorySchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - Mermaid inválido ou mal formatado',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/stories/upload-mermaid',
    tags: ['Stories'],
    summary: 'Upload de arquivo Mermaid (Admin)',
    description:
      'Faz upload de conteúdo Mermaid e cria uma história. Apenas admins. Wrapper REST que internamente chama o método RPC "uploadMermaid".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UploadMermaidSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'História criada a partir do arquivo Mermaid',
        content: {
          'application/json': {
            schema: StorySchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - Mermaid inválido ou mal formatado',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/stories/list',
    tags: ['Stories'],
    summary: 'Listar todas as histórias (Admin)',
    description:
      'Retorna todas as histórias cadastradas, incluindo inativas. Apenas admins. Wrapper REST que internamente chama o método RPC "listStories".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetStoriesSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Lista completa de histórias',
        content: {
          'application/json': {
            schema: StoriesListSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/stories/catalog',
    tags: ['Stories'],
    summary: 'Obter catálogo público de histórias',
    description:
      'Retorna apenas histórias ativas disponíveis para jogar. Acessível por todos os usuários autenticados. Wrapper REST que internamente chama o método RPC "getStoryCatalog".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetStoryCatalogSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Catálogo público de histórias ativas',
        content: {
          'application/json': {
            schema: PublicCatalogSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/stories/get',
    tags: ['Stories'],
    summary: 'Obter detalhes de uma história',
    description:
      'Retorna os detalhes completos de uma história específica. Wrapper REST que internamente chama o método RPC "getStory".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetStorySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Detalhes completos da história',
        content: {
          'application/json': {
            schema: StorySchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      404: {
        description: 'História não encontrada',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/rpc/stories/update',
    tags: ['Stories'],
    summary: 'Atualizar história (Admin)',
    description:
      'Atualiza dados de uma história existente. Se mermaidSource for atualizado, reparse automático. Apenas admins. Wrapper REST que internamente chama o método RPC "updateStory".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateStorySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'História atualizada com sucesso',
        content: {
          'application/json': {
            schema: StorySchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - Mermaid inválido se foi atualizado',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      404: {
        description: 'História não encontrada',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/rpc/stories/delete',
    tags: ['Stories'],
    summary: 'Excluir história (Admin)',
    description:
      'Exclui permanentemente uma história. Apenas admins. Wrapper REST que internamente chama o método RPC "deleteStory".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DeleteStorySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'História excluída com sucesso',
        content: {
          'application/json': {
            schema: DeleteStoryResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      404: {
        description: 'História não encontrada',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/stories/toggle-status',
    tags: ['Stories'],
    summary: 'Ativar/desativar história (Admin)',
    description:
      'Altera o status isActive de uma história. Histórias inativas não aparecem no catálogo público. Apenas admins. Wrapper REST que internamente chama o método RPC "toggleStoryStatus".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ToggleStoryStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Status da história alterado com sucesso',
        content: {
          'application/json': {
            schema: ToggleStoryStatusResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Acesso negado - apenas administradores',
      },
      404: {
        description: 'História não encontrada',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });
}
