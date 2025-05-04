import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  UserController, 
  VehicleController, 
  MessageController, 
  RequestController, 
  NotificationController 
} from './controllers';

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

  // Routes d'authentification
  server.post(`${prefix}/auth/register`, UserController.register);
  server.post(`${prefix}/auth/login`, UserController.login);

  // Routes utilisateurs
  server.get(`${prefix}/users/profile`, {
    onRequest: [server.authenticate],
    handler: UserController.getProfile
  });
  
  server.put(`${prefix}/users/profile`, {
    onRequest: [server.authenticate],
    handler: UserController.updateProfile
  });
  
  server.get(`${prefix}/users`, {
    onRequest: [server.requireAdmin],
    handler: UserController.getAllUsers
  });
  
  server.delete(`${prefix}/users/:id`, {
    onRequest: [server.requireAdmin],
    handler: UserController.deleteUser
  });
  
  server.put(`${prefix}/users/:id/vehicle-assignment`, {
    onRequest: [server.authenticate],
    handler: UserController.updateVehicleAssignmentStatus
  });

  // Routes véhicules
  server.post(`${prefix}/vehicles`, {
    onRequest: [server.requireAdmin],
    handler: VehicleController.createVehicle
  });
  
  server.get(`${prefix}/vehicles/:id`, {
    onRequest: [server.authenticate],
    handler: VehicleController.getVehicle
  });
  
  server.put(`${prefix}/vehicles/:id`, {
    onRequest: [server.requireAdmin],
    handler: VehicleController.updateVehicle
  });
  
  server.delete(`${prefix}/vehicles/:id`, {
    onRequest: [server.requireAdmin],
    handler: VehicleController.deleteVehicle
  });
  
  server.get(`${prefix}/vehicles`, {
    onRequest: [server.authenticate],
    handler: VehicleController.getAllVehicles
  });
  
  server.put(`${prefix}/vehicles/:id/location`, {
    onRequest: [server.authenticate],
    handler: VehicleController.updateLocation
  });
  
  server.get(`${prefix}/vehicles/:id/location-history`, {
    onRequest: [server.authenticate],
    handler: VehicleController.getLocationHistory
  });
  
  server.post(`${prefix}/vehicles/:id/assign`, {
    onRequest: [server.requireAdmin],
    handler: VehicleController.assignToUser
  });

  // Routes messages
  server.post(`${prefix}/messages`, {
    onRequest: [server.authenticate],
    handler: MessageController.sendMessage
  });
  
  server.get(`${prefix}/messages/:id`, {
    onRequest: [server.authenticate],
    handler: MessageController.getMessage
  });
  
  server.get(`${prefix}/messages`, {
    onRequest: [server.authenticate],
    handler: MessageController.getUserMessages
  });
  
  server.put(`${prefix}/messages/:id`, {
    onRequest: [server.authenticate],
    handler: MessageController.updateMessage
  });
  
  server.put(`${prefix}/messages/:id/archive`, {
    onRequest: [server.authenticate],
    handler: MessageController.archiveMessage
  });
  
  server.put(`${prefix}/messages/:id/unarchive`, {
    onRequest: [server.authenticate],
    handler: MessageController.unarchiveMessage
  });
  
  server.delete(`${prefix}/messages/:id`, {
    onRequest: [server.authenticate],
    handler: MessageController.deleteMessage
  });
  
  server.get(`${prefix}/messages/unread/count`, {
    onRequest: [server.authenticate],
    handler: MessageController.getUnreadCount
  });

  // Routes demandes
  server.post(`${prefix}/requests`, {
    onRequest: [server.authenticate],
    handler: RequestController.createRequest
  });
  
  server.get(`${prefix}/requests/:id`, {
    onRequest: [server.authenticate],
    handler: RequestController.getRequest
  });
  
  server.get(`${prefix}/requests/user`, {
    onRequest: [server.authenticate],
    handler: RequestController.getUserRequests
  });
  
  server.get(`${prefix}/requests`, {
    onRequest: [server.authenticate],
    handler: RequestController.getAllRequests
  });
  
  server.put(`${prefix}/requests/:id/status`, {
    onRequest: [server.requireAdmin],
    handler: RequestController.updateRequestStatus
  });
  
  server.delete(`${prefix}/requests/:id`, {
    onRequest: [server.authenticate],
    handler: RequestController.deleteRequest
  });
  
  server.get(`${prefix}/requests/stats`, {
    onRequest: [server.requireAdmin],
    handler: RequestController.getRequestStats
  });

  // Routes notifications
  server.get(`${prefix}/notifications`, {
    onRequest: [server.authenticate],
    handler: NotificationController.getUserNotifications
  });
  
  server.get(`${prefix}/notifications/:id`, {
    onRequest: [server.authenticate],
    handler: NotificationController.getNotification
  });
  
  server.put(`${prefix}/notifications/:id/read`, {
    onRequest: [server.authenticate],
    handler: NotificationController.markAsRead
  });
  
  server.put(`${prefix}/notifications/read-all`, {
    onRequest: [server.authenticate],
    handler: NotificationController.markAllAsRead
  });
  
  server.delete(`${prefix}/notifications/:id`, {
    onRequest: [server.authenticate],
    handler: NotificationController.deleteNotification
  });
  
  server.delete(`${prefix}/notifications`, {
    onRequest: [server.authenticate],
    handler: NotificationController.deleteAllNotifications
  });
  
  server.get(`${prefix}/notifications/unread/count`, {
    onRequest: [server.authenticate],
    handler: NotificationController.getUnreadCount
  });
} 