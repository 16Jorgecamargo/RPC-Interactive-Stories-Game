import pino from 'pino';

const buildLogPrefix = (context: Record<string, any>): string => {
  const tags: string[] = [];

  if (context.module) {
    tags.push(String(context.module));
  }

  if (context.reqId) {
    tags.push(`req=${context.reqId}`);
  }

  if (context.method) {
    tags.push(`method=${context.method}`);
  }

  if (context.roomId) {
    tags.push(`room=${context.roomId}`);
  }

  if (Array.isArray(context.playersJoined) && context.playersJoined.length > 0) {
    tags.push(`joined=${context.playersJoined.length}`);
  }

  if (Array.isArray(context.playersLeft) && context.playersLeft.length > 0) {
    tags.push(`left=${context.playersLeft.length}`);
  }

  return tags.length > 0 ? `[${tags.join(' ')}] ` : '';
};

// Logger centralizado para toda a aplicação
export const logger = pino({
  hooks: {
    logMethod(args, method) {
      if (args.length === 0) {
        return method.apply(this, args);
      }

      const [first, ...rest] = args as [any, ...any[]];
      if (typeof first === 'object' && first !== null) {
        const prefix = buildLogPrefix(first as Record<string, any>);
        if (prefix) {
          const trimmedPrefix = prefix.trimEnd();
          if (typeof rest[0] === 'string') {
            rest[0] = `${prefix}${rest[0]}`;
          } else if (rest.length === 0) {
            rest.push(trimmedPrefix);
          } else {
            rest.unshift(trimmedPrefix);
          }
          return method.apply(this, [first, ...rest]);
        }
      }

      return method.apply(this, args);
    },
  },
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
      singleLine: false,
    },
  },
  level: 'info',
});

// Loggers específicos por módulo com contexto
export const roomLogger = logger.child({ module: 'RoomManager' });
export const storyLogger = logger.child({ module: 'StoryManager' });
export const rpcLogger = logger.child({ module: 'JsonRPC' });
