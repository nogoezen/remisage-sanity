import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
      has_vehicle_assigned?: boolean;
    }
  }
  
  interface FastifyInstance {
    authenticate: any;
    requireAdmin: any;
  }
}

export default fp(async function (fastify: FastifyInstance) {
  // Middleware pour authentifier l'utilisateur
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Vérifier le token JWT
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Non autorisé' });
    }
  });

  // Middleware pour vérifier les droits d'administrateur
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Vérifier le token JWT
      await request.jwtVerify();
      
      // Vérifier si l'utilisateur est un administrateur
      if ((request.user as any).role !== 'admin') {
        reply.code(403).send({ error: 'Accès réservé aux administrateurs' });
        return;
      }
    } catch (err) {
      reply.code(401).send({ error: 'Non autorisé' });
    }
  });
}); 