import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const MessageTypeEnum = z
  .enum(['PLAYER', 'SYSTEM', 'VOTING_UPDATE'])
  .openapi({
    example: 'PLAYER',
    description: 'Tipo de mensagem: PLAYER (mensagem de jogador), SYSTEM (notificação do sistema), VOTING_UPDATE (atualização de votação)',
  });

export const MessageSchema = z.object({
  id: z.string().openapi({
    example: 'msg_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único da mensagem',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  userId: z.string().openapi({
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do usuário que enviou',
  }),
  username: z.string().openapi({
    example: 'jogador123',
    description: 'Nome do usuário (sempre presente)',
  }),
  characterId: z.string().optional().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem que enviou (null para mensagens SYSTEM ou sem personagem)',
  }),
  characterName: z.string().optional().openapi({
    example: 'Thorin',
    description: 'Nome do personagem (para exibição, null se usuário não tem personagem)',
  }),
  message: z.string().min(1).max(500).openapi({
    example: 'Vamos entrar na caverna!',
    description: 'Conteúdo da mensagem (máximo 500 caracteres)',
  }),
  type: MessageTypeEnum.openapi({
    example: 'PLAYER',
    description: 'Tipo da mensagem',
  }),
  timestamp: z.string().datetime().openapi({
    example: '2025-10-02T14:30:00.000Z',
    description: 'Data e hora da mensagem (ISO 8601)',
  }),
});

export const SendMessageSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  characterId: z.string().optional().openapi({
    example: 'char_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do personagem que está enviando (opcional - se não informado, usa username)',
  }),
  message: z.string().min(1).max(500).openapi({
    example: 'Vamos entrar na caverna!',
    description: 'Mensagem a ser enviada (máximo 500 caracteres)',
  }),
});

export const GetMessagesSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  limit: z.number().int().min(1).max(100).optional().openapi({
    example: 50,
    description: 'Número máximo de mensagens a retornar (padrão: 50)',
  }),
  since: z.string().optional().openapi({
    example: 'msg_123e4567-e89b-12d3-a456-426614174000',
    description: 'Retornar apenas mensagens após este ID (para polling)',
  }),
});

export const SendMessageResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a mensagem foi enviada com sucesso',
  }),
  message: MessageSchema.openapi({
    description: 'A mensagem enviada',
  }),
});

export const GetMessagesResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a operação foi bem-sucedida',
  }),
  messages: z.array(MessageSchema).openapi({
    description: 'Lista de mensagens da sessão',
  }),
  total: z.number().int().openapi({
    example: 42,
    description: 'Número total de mensagens na sessão',
  }),
});

export const SendRoomMessageSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
  message: z.string().min(1).max(500).openapi({
    example: 'Olá, pessoal!',
    description: 'Mensagem a ser enviada na sala de espera (máximo 500 caracteres, não persiste)',
  }),
});

export const SendRoomMessageResponseSchema = z.object({
  success: z.boolean().openapi({
    example: true,
    description: 'Indica se a mensagem foi enviada com sucesso',
  }),
  message: z.string().openapi({
    example: 'Mensagem enviada para a sala',
    description: 'Mensagem de confirmação',
  }),
  broadcastId: z.string().openapi({
    example: 'update_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do evento de broadcast gerado',
  }),
});

export const GetRoomMessagesSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGc...',
    description: 'JWT token do jogador',
  }),
  sessionId: z.string().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão',
  }),
});

export type Message = z.infer<typeof MessageSchema>;
export type SendMessageParams = z.infer<typeof SendMessageSchema>;
export type GetMessagesParams = z.infer<typeof GetMessagesSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type GetMessagesResponse = z.infer<typeof GetMessagesResponseSchema>;
export type MessageType = z.infer<typeof MessageTypeEnum>;
export type SendRoomMessageParams = z.infer<typeof SendRoomMessageSchema>;
export type SendRoomMessageResponse = z.infer<typeof SendRoomMessageResponseSchema>;
export type GetRoomMessagesParams = z.infer<typeof GetRoomMessagesSchema>;
