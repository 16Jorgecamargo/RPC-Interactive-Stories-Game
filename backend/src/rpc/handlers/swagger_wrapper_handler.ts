import { FastifyPluginAsync } from 'fastify';
import { registerAllWrappers } from './wrappers/index.js';

const swaggerWrapperHandler: FastifyPluginAsync = async (app) => {
  await registerAllWrappers(app);
};

export default swaggerWrapperHandler;
