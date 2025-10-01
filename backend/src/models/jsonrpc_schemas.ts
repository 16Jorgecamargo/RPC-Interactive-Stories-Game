import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0').openapi({ example: '2.0', description: 'Versão do protocolo JSON-RPC' }),
  id: z.union([z.string(), z.number()]).openapi({ example: 1, description: 'Identificador único da requisição' }),
  method: z.string().min(1).openapi({ example: 'login', description: 'Nome do método RPC a ser chamado' }),
  params: z.record(z.any()).optional().openapi({ example: { username: 'usuario1', password: 'senha123' }, description: 'Parâmetros do método' }),
});

export const JsonRpcErrorSchema = z.object({
  code: z.number().openapi({ example: -32600, description: 'Código de erro JSON-RPC' }),
  message: z.string().openapi({ example: 'Invalid Request', description: 'Mensagem de erro' }),
  data: z.any().optional().openapi({ example: { detail: 'Missing required field' }, description: 'Dados adicionais sobre o erro' }),
});

export const JsonRpcSuccessResponseSchema = z.object({
  jsonrpc: z.literal('2.0').openapi({ example: '2.0', description: 'Versão do protocolo JSON-RPC' }),
  id: z.union([z.string(), z.number()]).openapi({ example: 1, description: 'Identificador da requisição original' }),
  result: z.any().openapi({ example: { token: 'eyJhbGc...', user: { username: 'usuario1' } }, description: 'Resultado da chamada RPC' }),
});

export const JsonRpcErrorResponseSchema = z.object({
  jsonrpc: z.literal('2.0').openapi({ example: '2.0', description: 'Versão do protocolo JSON-RPC' }),
  id: z.union([z.string(), z.number(), z.null()]).openapi({ example: 1, description: 'Identificador da requisição original (null se não pudemos identificar)' }),
  error: JsonRpcErrorSchema,
});

export const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'ok', description: 'Status do servidor' }),
  timestamp: z.string().openapi({ example: '2025-10-01T12:00:00Z', description: 'Timestamp atual' }),
  uptime: z.number().openapi({ example: 12345.67, description: 'Tempo de atividade em segundos' }),
});

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  SERVER_ERROR: { code: -32000, message: 'Server error' },
  UNAUTHORIZED: { code: -32001, message: 'Unauthorized' },
  FORBIDDEN: { code: -32002, message: 'Forbidden' },
} as const;

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
export type JsonRpcSuccessResponse = z.infer<typeof JsonRpcSuccessResponseSchema>;
export type JsonRpcErrorResponse = z.infer<typeof JsonRpcErrorResponseSchema>;
export type JsonRpcError = z.infer<typeof JsonRpcErrorSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
