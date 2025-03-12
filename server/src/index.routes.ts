import { FastifyInstance } from 'fastify';

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
        const user = {
          id: 1,
          firstName: 'Admin',
          lastName: 'Test',
          email: 'admin@remisage.com',
          role: 'admin'
        };
        
        // Générer un vrai token JWT
        const token = server.jwt.sign({ id: String(user.id), email: user.email, role: user.role });
        
        return {
          token,
          user
        };
      }

      // Simuler une connexion réussie pour le déploiement
      if (email === 'employee@remisage.com' && password === 'employee123') {
        const user = {
          id: 2,
          firstName: 'Employee',
          lastName: 'Test',
          email: 'employee@remisage.com',
          role: 'employee'
        };
        
        // Générer un vrai token JWT
        const token = server.jwt.sign({ id: String(user.id), email: user.email, role: user.role });
        
        return {
          token,
          user
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
      // Vérifier si l'utilisateur est authentifié
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentification requise' });
      }
      
      // Récupérer les informations de l'utilisateur à partir du token JWT
      const { id, email, role } = request.user;
      
      // Simuler un profil utilisateur pour le déploiement
      // En utilisant les informations du token JWT
      if (role === 'admin') {
        return {
          id: Number(id),
          firstName: 'Admin',
          lastName: 'Test',
          email,
          role
        };
      } else {
        return {
          id: Number(id),
          firstName: 'Employee',
          lastName: 'Test',
          email,
          role
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération du profil' });
    }
  });

  // Route pour récupérer tous les véhicules
  server.get(`${prefix}/vehicles`, async (request, reply) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentification requise' });
      }
      
      // Simuler une liste de véhicules pour le déploiement
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des véhicules' });
    }
  });

  // Route pour récupérer toutes les demandes
  server.get(`${prefix}/requests`, async (request, reply) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentification requise' });
      }
      
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
      // Vérifier si l'utilisateur est authentifié
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentification requise' });
      }
      
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
  });

  // Route pour récupérer le nombre de notifications non lues
  server.get(`${prefix}/notifications/unread/count`, async (request, reply) => {
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
  });
} 