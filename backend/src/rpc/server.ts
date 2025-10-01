import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth.js';
import authHandler from './handlers/auth_handler.js';
import { registry } from './openapi_registry.js';

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
      credentials: true
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const openapiDocument = generator.generateDocument({
      openapi: '3.0.3',
      info: {
        title: 'RPC Interactive Stories API',
        description: 'API JSON-RPC 2.0 para sistema de histórias interativas multiplayer',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server'
        },
        {
          url: 'http://173.249.60.72:8443',
          description: 'Production server'
        }
      ],
      tags: [
        { name: 'Auth', description: 'Autenticação e registro' },
        { name: 'Users', description: 'Gerenciamento de usuários' },
        { name: 'Characters', description: 'Personagens D&D' },
        { name: 'Stories', description: 'Histórias e narrativas' },
        { name: 'Sessions', description: 'Sessões de jogo' },
        { name: 'Game', description: 'Mecânicas de jogo' },
        { name: 'Chat', description: 'Sistema de mensagens' },
        { name: 'Admin', description: 'Funções administrativas' }
      ]
    });

    await app.register(swagger, {
      mode: 'static',
      specification: {
        document: openapiDocument as any
      }
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      },
      staticCSP: true
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    await app.register(authHandler);

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
