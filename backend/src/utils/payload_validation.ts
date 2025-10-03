import { FastifyRequest, FastifyReply } from 'fastify';
import { logWarning } from './logger.js';

export interface PayloadSizeOptions {
  maxSize: number;
  maxArrayLength?: number;
  maxStringLength?: number;
  maxObjectDepth?: number;
}

const DEFAULT_OPTIONS: PayloadSizeOptions = {
  maxSize: 1024 * 1024,
  maxArrayLength: 1000,
  maxStringLength: 10000,
  maxObjectDepth: 10,
};

export function validatePayloadSize(
  payload: unknown,
  options: Partial<PayloadSizeOptions> = {}
): { valid: boolean; errors: string[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  const jsonString = JSON.stringify(payload);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

  if (sizeInBytes > opts.maxSize) {
    errors.push(
      `Payload muito grande: ${sizeInBytes} bytes (máximo: ${opts.maxSize} bytes)`
    );
  }

  if (typeof payload === 'object' && payload !== null) {
    validateObject(payload, opts, errors, 0);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateObject(
  obj: unknown,
  options: PayloadSizeOptions,
  errors: string[],
  depth: number
): void {
  if (depth > (options.maxObjectDepth || 10)) {
    errors.push(`Objeto muito profundo: profundidade ${depth} (máximo: ${options.maxObjectDepth})`);
    return;
  }

  if (Array.isArray(obj)) {
    if (obj.length > (options.maxArrayLength || 1000)) {
      errors.push(`Array muito grande: ${obj.length} itens (máximo: ${options.maxArrayLength})`);
    }

    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        validateObject(item, options, errors, depth + 1);
      } else if (typeof item === 'string' && item.length > (options.maxStringLength || 10000)) {
        errors.push(
          `String muito longa no array: ${item.length} caracteres (máximo: ${options.maxStringLength})`
        );
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > (options.maxStringLength || 10000)) {
        errors.push(
          `String muito longa no campo "${key}": ${value.length} caracteres (máximo: ${options.maxStringLength})`
        );
      } else if (typeof value === 'object' && value !== null) {
        validateObject(value, options, errors, depth + 1);
      }
    }
  }
}

export function createPayloadValidationHook(options?: Partial<PayloadSizeOptions>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.body) {
      const result = validatePayloadSize(request.body, options);

      if (!result.valid) {
        logWarning('Payload validation failed', {
          url: request.url,
          method: request.method,
          errors: result.errors,
        });

        return reply.code(413).send({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: 'Payload muito grande ou inválido',
            data: { errors: result.errors },
          },
        });
      }
    }
  };
}

export const RPC_PAYLOAD_LIMITS: Record<string, Partial<PayloadSizeOptions>> = {
  register: {
    maxSize: 5 * 1024,
    maxStringLength: 100,
  },
  login: {
    maxSize: 2 * 1024,
    maxStringLength: 100,
  },
  sendMessage: {
    maxSize: 10 * 1024,
    maxStringLength: 500,
  },
  createCharacter: {
    maxSize: 50 * 1024,
    maxStringLength: 500,
    maxArrayLength: 20,
  },
  uploadMermaid: {
    maxSize: 500 * 1024,
    maxStringLength: 100000,
  },
  vote: {
    maxSize: 5 * 1024,
    maxStringLength: 100,
  },
};
