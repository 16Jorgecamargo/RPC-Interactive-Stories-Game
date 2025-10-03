import { FastifyRequest, FastifyReply } from 'fastify';
import { globalRateLimiter, authRateLimiter } from '../../utils/rate_limit.js';
import { logWarning } from '../../utils/logger.js';

export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const identifier = request.ip || 'unknown';
  
  const isAuthEndpoint = 
    request.url.includes('/rpc/auth') || 
    request.url === '/rpc' && 
    request.body && 
    typeof request.body === 'object' && 
    'method' in request.body && 
    (request.body.method === 'login' || request.body.method === 'register');

  const limiter = isAuthEndpoint ? authRateLimiter : globalRateLimiter;
  const result = limiter.check(identifier);

  reply.header('X-RateLimit-Limit', limiter.getStats().maxRequests.toString());
  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  if (!result.allowed) {
    logWarning('Rate limit exceeded', {
      ip: request.ip,
      url: request.url,
      method: request.method,
      remaining: result.remaining,
      resetAt: new Date(result.resetAt).toISOString(),
    });

    return reply.code(429).send({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32000,
        message: 'Too many requests',
        data: {
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          resetAt: new Date(result.resetAt).toISOString(),
        },
      },
    });
  }
}
