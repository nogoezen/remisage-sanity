import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import registerRoutes from './index.routes';

// Charger les variables d'environnement
dotenv.config();

// Créer l'instance Fastify
const server = Fastify({
  logger: true,
  trustProxy: true // Important pour Vercel
});

// Configurer CORS
server.register(cors, {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://remisage-client.vercel.app', // Ajoutez l'URL de votre frontend déployé
    'https://remisage-sanity.vercel.app' // URL actuelle du client
  ],
  credentials: true
});

// Configurer JWT
server.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

// Le décorateur 'user' est automatiquement ajouté par le plugin JWT
// Ne pas ajouter manuellement : server.decorateRequest('user', null);

// Middleware d'authentification pour les routes qui ne sont pas gérées par les contrôleurs
server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  // Log pour déboguer
  console.log(`Route appelée: ${request.method} ${request.url} (${request.routerPath || 'unknown'})`);
  
  // Vérifier si la route nécessite une authentification
  if (request.routerPath === '/api/auth/login' || 
      request.routerPath === '/api/auth/register' ||
      request.routerPath === '/' ||
      request.routerPath === '/api/health') {
    console.log('Route publique, pas d\'authentification requise');
    return;
  }

  // Log pour déboguer les en-têtes d'authentification
  const authHeader = request.headers.authorization;
  console.log(`En-tête d'autorisation: ${authHeader ? 'Présent' : 'Absent'}`);
  
  // Vérifier le token JWT pour les routes qui ne sont pas explicitement exclues
  try {
    await request.jwtVerify();
    console.log('Utilisateur authentifié:', request.user);
  } catch (err) {
    console.error('Erreur d\'authentification:', err);
    // Les routes avec leurs propres middlewares d'authentification géreront cela elles-mêmes
    // Donc on ne renvoie pas d'erreur ici, on laisse la requête continuer
    console.log('Erreur de vérification JWT, peut être gérée par un middleware spécifique');
  }
});

// Configurer Swagger
server.register(swagger, {
  swagger: {
    info: {
      title: 'API Remisage',
      description: 'API pour l\'application Remisage',
      version: '1.0.0'
    },
    host: process.env.HOST || 'localhost',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

server.register(swaggerUi, {
  routePrefix: '/documentation'
});

// Enregistrer les routes avec les contrôleurs Sanity
registerRoutes(server);

// Fonction de démarrage du serveur
const start = async () => {
  try {
    // Pour le développement local
    if (process.env.NODE_ENV !== 'production') {
      await server.listen({ 
        port: process.env.PORT ? parseInt(process.env.PORT) : 5000, 
        host: '0.0.0.0' 
      });
      server.log.info(`Server listening on ${process.env.PORT || 5000}`);
    } else {
      // Pour Vercel (serverless)
      await server.ready();
      server.log.info('Server ready for serverless deployment');
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Démarrer le serveur si ce n'est pas un import
if (require.main === module) {
  start();
}

// Nécessaire pour Vercel
export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit('request', req, res);
}; 