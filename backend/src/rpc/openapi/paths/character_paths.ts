import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  CreateCharacterSchema,
  GetCharactersSchema,
  GetCharacterSchema,
  UpdateCharacterSchema,
  DeleteCharacterSchema,
  GetCharacterOptionsSchema,
  CharacterResponseSchema,
  CharactersListSchema,
  DeleteCharacterResponseSchema,
  CharacterOptionsResponseSchema,
} from '../../../models/character_schemas.js';

export function registerCharacterPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/character-options',
    tags: ['Characters'],
    summary: 'Obter opções de raças e classes',
    description:
      'Retorna todas as raças e classes disponíveis para criação de personagens, incluindo descrições e traits. Wrapper REST que internamente chama o método RPC "getCharacterOptions".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetCharacterOptionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Opções de raças e classes retornadas com sucesso',
        content: {
          'application/json': {
            schema: CharacterOptionsResponseSchema,
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
    path: '/rpc/characters',
    tags: ['Characters'],
    summary: 'Criar novo personagem',
    description:
      'Cria um novo personagem D&D com atributos, raça, classe e background. Wrapper REST que internamente chama o método RPC "createCharacter".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateCharacterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Personagem criado com sucesso',
        content: {
          'application/json': {
            schema: CharacterResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - atributos inválidos ou sessão não encontrada',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Usuário não é participante da sessão',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/characters/list',
    tags: ['Characters'],
    summary: 'Listar meus personagens',
    description:
      'Retorna todos os personagens do usuário autenticado. Wrapper REST que internamente chama o método RPC "getMyCharacters".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetCharactersSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Lista de personagens do usuário',
        content: {
          'application/json': {
            schema: CharactersListSchema,
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
    path: '/rpc/characters/get',
    tags: ['Characters'],
    summary: 'Obter detalhes de personagem',
    description:
      'Retorna os detalhes completos de um personagem específico. Wrapper REST que internamente chama o método RPC "getCharacter".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetCharacterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Detalhes do personagem',
        content: {
          'application/json': {
            schema: CharacterResponseSchema,
          },
        },
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Personagem não pertence ao usuário',
      },
      404: {
        description: 'Personagem não encontrado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/rpc/characters/update',
    tags: ['Characters'],
    summary: 'Atualizar personagem',
    description:
      'Atualiza dados de um personagem existente. Não é possível editar personagens vinculados a sessões. Wrapper REST que internamente chama o método RPC "updateCharacter".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateCharacterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Personagem atualizado com sucesso',
        content: {
          'application/json': {
            schema: CharacterResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - personagem vinculado a sessão não pode ser editado',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Personagem não pertence ao usuário',
      },
      404: {
        description: 'Personagem não encontrado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/rpc/characters/delete',
    tags: ['Characters'],
    summary: 'Excluir personagem',
    description:
      'Exclui um personagem permanentemente. Não é possível excluir personagens vinculados a sessões. Wrapper REST que internamente chama o método RPC "deleteCharacter".',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DeleteCharacterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Personagem excluído com sucesso',
        content: {
          'application/json': {
            schema: DeleteCharacterResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - personagem vinculado a sessão não pode ser excluído',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Personagem não pertence ao usuário',
      },
      404: {
        description: 'Personagem não encontrado',
      },
      500: {
        description: 'Erro interno do servidor',
      },
    },
  });
}
