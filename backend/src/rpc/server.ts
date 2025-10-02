import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth.js';
import jsonRpcHandler from './handlers/jsonrpc_handler.js';
import swaggerWrapperHandler from './handlers/swagger_wrapper_handler.js';
import { registry } from './openapi/registry.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8443', 10);
const HOST = '0.0.0.0';

const app = Fastify({ logger: true });

app.decorate('authenticate', authenticate);

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
      ],
    });

    await app.register(swagger, {
      mode: 'static',
      specification: {
        document: openapiDocument as any,
      },
    });

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

    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📚 Swagger docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
