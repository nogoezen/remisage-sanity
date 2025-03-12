import fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

export const createServer = (): FastifyInstance => {
  const server = fastify({
    logger: true
  });

  // Configuration CORS
  server.register(fastifyCors, {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  });

  // Configuration JWT
  server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key'
  });

  // Middleware d'authentification
  server.addHook('onRequest', async (request, reply) => {
    try {
      if (request.routerPath === '/api/auth/login' || request.routerPath === '/api/auth/register') {
        return;
      }
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  return server;
}; 