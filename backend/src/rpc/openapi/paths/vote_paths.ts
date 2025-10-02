import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  SubmitVoteSchema,
  GetVoteStatusSchema,
  ResolveTieSchema,
  SubmitVoteResponseSchema,
  VoteStatusResponseSchema,
  ResolveTieResponseSchema,
} from '../../../models/vote_schemas.js';

export function registerVotePaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/rpc/game/vote',
    tags: ['Vote'],
    summary: 'Registrar voto em opção do capítulo',
    description:
      'Permite que um jogador registre seu voto em uma das opções disponíveis no capítulo atual. Validações: sessão IN_PROGRESS, personagem pertence ao jogador, opção válida, jogador ainda não votou. Se todos os participantes online votarem, a votação é finalizada automaticamente e o jogo avança para o próximo capítulo.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitVoteSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voto registrado com sucesso',
        content: {
          'application/json': {
            schema: SubmitVoteResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - opção inválida ou jogador já votou',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Personagem não pertence ao jogador ou à sessão',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/game/vote-status',
    tags: ['Vote'],
    summary: 'Consultar status da votação atual',
    description:
      'Retorna informações detalhadas sobre o estado atual da votação: total de participantes online, quantos já votaram, contagem de votos por opção (com percentuais), lista de jogadores que ainda não votaram, e se o jogador atual já votou.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetVoteStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Status da votação obtido com sucesso',
        content: {
          'application/json': {
            schema: VoteStatusResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Não autorizado - você não é participante desta sessão',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/rpc/game/resolve-tie',
    tags: ['Vote'],
    summary: 'Resolver empate em votação (mestre)',
    description:
      'Permite que o mestre (owner) da sessão resolva um empate na votação. Estratégias disponíveis: RANDOM (escolhe aleatoriamente entre as opções empatadas), MASTER_DECIDES (mestre escolhe manualmente a opção vencedora). Apenas o owner pode chamar este método.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ResolveTieSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Empate resolvido com sucesso',
        content: {
          'application/json': {
            schema: ResolveTieResponseSchema,
          },
        },
      },
      400: {
        description: 'Erro de validação - masterChoice obrigatório para MASTER_DECIDES',
      },
      401: {
        description: 'Token inválido ou expirado',
      },
      403: {
        description: 'Apenas o mestre da sessão pode resolver empates',
      },
    },
  });
}
