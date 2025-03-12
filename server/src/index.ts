import { config } from 'dotenv';
import path from 'path';

// Charger les variables d'environnement - ensure this runs first
config({ path: path.resolve(process.cwd(), '.env') });

// Vérifier le chemin du fichier .env
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('SANITY_PROJECT_ID:', process.env.SANITY_PROJECT_ID);
console.log('SANITY_DATASET:', process.env.SANITY_DATASET);
console.log('SANITY_TOKEN:', process.env.SANITY_TOKEN ? '******' : 'not set');

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import compress from '@fastify/compress';

// Declare module for Fastify JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { 
      id: string;
      email: string;
      role: string;
      has_vehicle_assigned?: boolean;
    }
    user: {
      id: string;
      email: string;
      role: string;
      has_vehicle_assigned?: boolean;
    }
  }
}

// Import plugins
import authenticate from './plugins/authenticate';
import validation from './plugins/validation';

// Import routes
import registerRoutes from './routes';

// Import error handler
import { handleError } from './utils/errorHandler';

// Create Fastify instance
const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
  },
  trustProxy: true,
});

// Register plugins
server.register(cors, {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

// Register compression
server.register(compress, { 
  encodings: ['gzip', 'deflate']
});

// Register authentication plugin
server.register(authenticate);

// Register validation plugin
server.register(validation);

// Configuration Swagger
server.register(swagger, {
  swagger: {
    info: {
      title: 'Remisage API',
      description: 'API for Remisage vehicle management application',
      version: '0.1.0'
    },
    host: `localhost:${process.env.PORT || 5000}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

// Configuration Swagger UI
server.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  staticCSP: true
});

// Middleware d'authentification
server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (
      request.url === '/api/auth/login' || 
      request.url === '/api/auth/register' || 
      request.url === '/' ||
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/swagger')
    ) {
      return;
    }
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Gestionnaire d'erreurs global
server.setErrorHandler((error, _request, reply) => {
  return handleError(error, reply);
});

// Enregistrer les routes
server.register(registerRoutes);

// Run the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
    console.log(`Documentation available at http://${host}:${port}/documentation`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Gestion des signaux pour un arrêt propre
const signals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`Received ${signal}, closing server...`);
    await server.close();
    process.exit(0);
  });
}

start(); 