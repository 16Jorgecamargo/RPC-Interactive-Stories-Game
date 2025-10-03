import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate_limit.js';
import jsonRpcHandler from './handlers/jsonrpc_handler.js';
import swaggerWrapperHandler from './handlers/swagger_wrapper_handler.js';
import { registry } from './openapi/registry.js';
import { startCleanupScheduler, startHeartbeatChecker } from '../utils/scheduler.js';
import { logInfo, logError } from '../utils/logger.js';
import { createPayloadValidationHook } from '../utils/payload_validation.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8443', 10);
const HOST = '0.0.0.0';

const app = Fastify({
  logger: false,
  bodyLimit: 1024 * 1024,
});

app.decorate('authenticate', authenticate);

app.addHook('onRequest', rateLimitMiddleware);

app.addHook('onRequest', async (request) => {
  const logData: Record<string, unknown> = {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };

  if (request.body && typeof request.body === 'object') {
    const body = request.body as { method?: string; params?: Record<string, unknown> };
    if (body.method) {
      logData.rpcMethod = body.method;
      
      if (body.params) {
        const safeParams = { ...body.params };
        if ('password' in safeParams) safeParams.password = '***';
        if ('newPassword' in safeParams) safeParams.newPassword = '***';
        if ('currentPassword' in safeParams) safeParams.currentPassword = '***';
        if ('confirmPassword' in safeParams) safeParams.confirmPassword = '***';
        if ('token' in safeParams) safeParams.token = `${String(safeParams.token).substring(0, 20)}...`;
        
        logData.rpcParams = safeParams;
      }
    }
  }

  logInfo('[HTTP] Requisição recebida', logData);
});

app.addHook('preHandler', createPayloadValidationHook({
  maxSize: 1024 * 1024,
  maxArrayLength: 1000,
  maxStringLength: 10000,
  maxObjectDepth: 10,
}));

app.addHook('onResponse', async (request, reply) => {
  const logData: Record<string, unknown> = {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: `${reply.elapsedTime}ms`,
  };

  if (request.body && typeof request.body === 'object') {
    const body = request.body as { method?: string };
    if (body.method) {
      logData.rpcMethod = body.method;
    }
  }

  const logLevel = reply.statusCode >= 400 ? 'error' : 'info';
  if (logLevel === 'error') {
    logError(new Error(`HTTP ${reply.statusCode}: ${request.url}`), logData);
  } else {
    logInfo('[HTTP] Resposta enviada', logData);
  }
});

async function start() {
  try {
    await app.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const openapiDocument = generator.generateDocument({
      openapi: '3.0.3',
      info: {
        title: 'RPC Interactive Stories API',
        description: 'API JSON-RPC 2.0 para sistema de histórias interativas multiplayer',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
        {
          url: 'http://173.249.60.72:8443',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'JSON-RPC', description: 'Endpoint JSON-RPC 2.0 puro (usado pelo frontend)' },
        { name: 'Auth', description: 'Autenticação (wrappers para Swagger UI)' },
        { name: 'Health', description: 'Verificação de saúde do servidor' },
        { name: 'Users', description: 'Gerenciamento de usuários (wrappers para Swagger UI)' },
        { name: 'Characters', description: 'Gerenciamento de personagens D&D (wrappers para Swagger UI)' },
        { name: 'Stories', description: 'Gerenciamento de histórias interativas (wrappers para Swagger UI)' },
        { name: 'Sessions', description: 'Gerenciamento de sessões de jogo (wrappers para Swagger UI)' },
        { name: 'Game', description: 'Lógica de gameplay e estados de jogo (wrappers para Swagger UI)' },
        { name: 'Vote', description: 'Sistema de votação colaborativa (wrappers para Swagger UI)' },
        { name: 'Chat', description: 'Sistema de chat em tempo real (wrappers para Swagger UI)' },
        { name: 'Updates', description: 'Long polling para atualizações em tempo real (wrappers para Swagger UI)' },
        { name: 'Combat', description: 'Sistema de combate D&D (wrappers para Swagger UI)' },
        { name: 'Admin', description: 'Painel administrativo - gerenciamento de usuários e sistema (apenas admins)' },
      ],
    });

    await app.register(swagger, {
      mode: 'static',
      specification: {
        document: openapiDocument as unknown as Record<string, unknown>,
      },
    } as never);

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(jsonRpcHandler);
    await app.register(swaggerWrapperHandler);

    await app.ready();
    await app.listen({ port: PORT, host: HOST });

    startCleanupScheduler();
    startHeartbeatChecker();

    logInfo(`[SERVIDOR] Rodando em http://${HOST}:${PORT}`);
    logInfo(`[DOCS] Swagger disponivel em http://${HOST}:${PORT}/docs`);
    logInfo('[SCHEDULER] Limpeza inicializada');
    logInfo('[HEARTBEAT] Verificador inicializado');
  } catch (err) {
    logError(err);
    process.exit(1);
  }
}

start();
