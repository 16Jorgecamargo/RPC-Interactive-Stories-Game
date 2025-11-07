import Fastify from 'fastify';
import cors from '@fastify/cors';
import { JsonRpcServer } from './json-rpc-server.js';
import { logger } from './logger.js';

const PORT = 3000;
const HOST = '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: logger
  });

  // Registrar CORS
  await fastify.register(cors, {
    origin: true, // Permitir qualquer origem em desenvolvimento
  });

  // Criar servidor JSON-RPC
  const rpcServer = new JsonRpcServer();

  // Rota de health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Rota JSON-RPC
  fastify.post('/rpc', async (request, reply) => {
    return rpcServer.handleRequest(request, reply);
  });

  // Iniciar servidor
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info('===========================================');
    fastify.log.info(' Adventure Game Backend Server');
    fastify.log.info('===========================================');
    fastify.log.info(` Server running at: http://localhost:${PORT}`);
    fastify.log.info(` JSON-RPC endpoint: http://localhost:${PORT}/rpc`);
    fastify.log.info(` Health check: http://localhost:${PORT}/health`);
    fastify.log.info('===========================================');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
