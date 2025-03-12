import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import usersRoutes from './routes/users';
import vehiclesRoutes from './routes/vehicles';
import messagesRoutes from './routes/messages';
import requestsRoutes from './routes/requests';

// Fonction pour enregistrer toutes les routes
export default async function registerRoutes(server: FastifyInstance, prefix: string = '/api') {
  // Route de test pour vérifier que le serveur fonctionne
  server.get('/', async (_request, _reply) => {
    return { status: 'ok', message: 'API Remisage fonctionne correctement' };
  });

  // Route de santé pour les vérifications
  server.get(`${prefix}/health`, async (_request, _reply) => {
    return { status: 'ok', environment: process.env.NODE_ENV };
  });

  // Ajouter les décorateurs nécessaires pour les routes
  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }
    } catch (err) {
      reply.send(err);
    }
  });

  // Enregistrer les routes utilisateurs
  server.register(usersRoutes, { prefix: `${prefix}` });
  
  // Enregistrer les routes véhicules
  server.register(vehiclesRoutes, { prefix: `${prefix}/vehicles` });
  
  // Enregistrer les routes messages
  server.register(messagesRoutes, { prefix: `${prefix}/messages` });
  
  // Enregistrer les routes demandes
  server.register(requestsRoutes, { prefix: `${prefix}/requests` });
  
  // Routes pour les notifications (à implémenter plus tard)
  server.get(`${prefix}/notifications`, {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      try {
        // Vérifier si l'utilisateur est authentifié
        if (!request.user) {
          return reply.status(401).send({ error: 'Authentification requise' });
        }
        
        // Simuler une liste de notifications pour le déploiement
        return [];
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return reply.status(500).send({ error: 'Erreur lors de la récupération des notifications' });
      }
    }
  });

  // Route pour récupérer le nombre de notifications non lues
  server.get(`${prefix}/notifications/unread/count`, {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      try {
        // Vérifier si l'utilisateur est authentifié
        if (!request.user) {
          return reply.status(401).send({ error: 'Authentification requise' });
        }
        
        // Simuler un nombre de notifications non lues pour le déploiement
        return { unreadCount: 0 };
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
        return reply.status(500).send({ error: 'Erreur lors de la récupération du nombre de notifications non lues' });
      }
    }
  });
} 