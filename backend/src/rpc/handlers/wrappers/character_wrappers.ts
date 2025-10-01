import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as characterService from '../../../services/character_service.js';
import {
  CreateCharacterSchema,
  GetCharactersSchema,
  GetCharacterSchema,
  UpdateCharacterSchema,
  DeleteCharacterSchema,
  CharacterResponseSchema,
  CharactersListSchema,
  DeleteCharacterResponseSchema,
} from '../../../models/character_schemas.js';

export async function registerCharacterWrappers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/characters',
    schema: {
      tags: ['Characters'],
      summary: 'Criar novo personagem',
      description:
        'Cria um novo personagem D&D com atributos, raça, classe e background. Internamente usa JSON-RPC 2.0 (method: "createCharacter").',
      body: CreateCharacterSchema,
      response: {
        200: CharacterResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await characterService.createCharacter(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/characters/list',
    schema: {
      tags: ['Characters'],
      summary: 'Listar meus personagens',
      description:
        'Retorna todos os personagens do usuário autenticado. Internamente usa JSON-RPC 2.0 (method: "getMyCharacters").',
      body: GetCharactersSchema,
      response: {
        200: CharactersListSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await characterService.getMyCharacters(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/rpc/characters/get',
    schema: {
      tags: ['Characters'],
      summary: 'Obter detalhes de personagem',
      description:
        'Retorna os detalhes completos de um personagem específico. Internamente usa JSON-RPC 2.0 (method: "getCharacter").',
      body: GetCharacterSchema,
      response: {
        200: CharacterResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await characterService.getCharacter(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/rpc/characters/update',
    schema: {
      tags: ['Characters'],
      summary: 'Atualizar personagem',
      description:
        'Atualiza dados de um personagem existente. Não é possível editar personagens vinculados a sessões. Internamente usa JSON-RPC 2.0 (method: "updateCharacter").',
      body: UpdateCharacterSchema,
      response: {
        200: CharacterResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await characterService.updateCharacter(request.body);
      return reply.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/rpc/characters/delete',
    schema: {
      tags: ['Characters'],
      summary: 'Excluir personagem',
      description:
        'Exclui um personagem permanentemente. Não é possível excluir personagens vinculados a sessões. Internamente usa JSON-RPC 2.0 (method: "deleteCharacter").',
      body: DeleteCharacterSchema,
      response: {
        200: DeleteCharacterResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await characterService.deleteCharacter(request.body);
      return reply.send(result);
    },
  });
}
