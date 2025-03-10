import { FastifyInstance } from 'fastify';

// Fonction pour enregistrer toutes les routes
export default async function registerRoutes(server: FastifyInstance, prefix: string = '/api') {
  // Route de test pour vérifier que le serveur fonctionne
  server.get('/', async (request, reply) => {
    return { status: 'ok', message: 'API Remisage fonctionne correctement' };
  });

  // Route de santé pour les vérifications
  server.get(`${prefix}/health`, async (request, reply) => {
    return { status: 'ok', environment: process.env.NODE_ENV };
  });

  // Routes d'authentification
  server.post(`${prefix}/auth/login`, async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };
      
      // Vérification des paramètres
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email et mot de passe requis' });
      }

      // Simuler une connexion réussie pour le déploiement
      if (email === 'admin@remisage.com' && password === 'admin123') {
        return {
          token: 'token_simulé_pour_déploiement',
          user: {
            id: 1,
            firstName: 'Admin',
            lastName: 'Test',
            email: 'admin@remisage.com',
            role: 'admin'
          }
        };
      }

      // Simuler une connexion réussie pour le déploiement
      if (email === 'employee@remisage.com' && password === 'employee123') {
        return {
          token: 'token_simulé_pour_déploiement',
          user: {
            id: 2,
            firstName: 'Employee',
            lastName: 'Test',
            email: 'employee@remisage.com',
            role: 'employee'
          }
        };
      }

      return reply.status(401).send({ error: 'Email ou mot de passe incorrect' });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return reply.status(500).send({ error: 'Erreur lors de la connexion' });
    }
  });

  // Route pour récupérer le profil utilisateur
  server.get(`${prefix}/users/profile`, async (request, reply) => {
    try {
      // Simuler un profil utilisateur pour le déploiement
      return {
        id: 1,
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@remisage.com',
        role: 'admin'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération du profil' });
    }
  });

  // Route pour récupérer tous les véhicules
  server.get(`${prefix}/vehicles`, async (request, reply) => {
    try {
      // Simuler une liste de véhicules pour le déploiement
      return [
        {
          id: 1,
          model: 'Renault Clio',
          licensePlate: 'AA-123-BB',
          status: 'available',
          address: '1 Rue de Paris, 75001 Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          model: 'Peugeot 308',
          licensePlate: 'CC-456-DD',
          status: 'assigned',
          assignedTo: 2,
          address: '2 Avenue des Champs-Élysées, 75008 Paris',
          latitude: 48.8698,
          longitude: 2.3075,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des véhicules' });
    }
  });

  // Route pour récupérer toutes les demandes
  server.get(`${prefix}/requests`, async (request, reply) => {
    try {
      // Simuler une liste de demandes pour le déploiement
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des demandes' });
    }
  });

  // Route pour récupérer tous les messages
  server.get(`${prefix}/messages`, async (request, reply) => {
    try {
      // Simuler une liste de messages pour le déploiement
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des messages' });
    }
  });

  // Route pour récupérer toutes les notifications
  server.get(`${prefix}/notifications`, async (request, reply) => {
    try {
      // Simuler une liste de notifications pour le déploiement
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des notifications' });
    }
  });
} 