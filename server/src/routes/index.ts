import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers';
import { VehicleController } from '../controllers';
import { MessageController } from '../controllers';
import { RequestController } from '../controllers';
import { NotificationController } from '../controllers';

export default async function registerRoutes(server: FastifyInstance) {
  // Routes d'authentification
  server.post('/api/auth/register', UserController.register);
  server.post('/api/auth/login', UserController.login);

  // Routes utilisateurs
  server.get('/api/users/profile', UserController.getProfile);
  server.put('/api/users/profile', UserController.updateProfile);
  server.get('/api/users', UserController.getAllUsers);
  server.delete('/api/users/:id', UserController.deleteUser);
  server.put('/api/users/:id/vehicle-assignment', UserController.updateVehicleAssignmentStatus);

  // Routes véhicules
  server.post('/api/vehicles', VehicleController.createVehicle);
  server.get('/api/vehicles/:id', VehicleController.getVehicle);
  server.put('/api/vehicles/:id', VehicleController.updateVehicle);
  server.delete('/api/vehicles/:id', VehicleController.deleteVehicle);
  server.get('/api/vehicles', VehicleController.getAllVehicles);
  server.put('/api/vehicles/:id/location', VehicleController.updateLocation);
  server.get('/api/vehicles/:id/location-history', VehicleController.getLocationHistory);
  server.post('/api/vehicles/:id/assign', VehicleController.assignToUser);

  // Routes messages
  server.post('/api/messages', MessageController.sendMessage);
  server.get('/api/messages/:id', MessageController.getMessage);
  server.get('/api/messages', MessageController.getUserMessages);
  server.put('/api/messages/:id', MessageController.updateMessage);
  server.put('/api/messages/:id/archive', MessageController.archiveMessage);
  server.put('/api/messages/:id/unarchive', MessageController.unarchiveMessage);
  server.delete('/api/messages/:id', MessageController.deleteMessage);
  server.get('/api/messages/unread/count', MessageController.getUnreadCount);

  // Routes demandes
  server.post('/api/requests', RequestController.createRequest);
  server.get('/api/requests/:id', RequestController.getRequest);
  server.get('/api/requests/user', RequestController.getUserRequests);
  server.get('/api/requests', RequestController.getAllRequests);
  server.put('/api/requests/:id/status', RequestController.updateRequestStatus);
  server.delete('/api/requests/:id', RequestController.deleteRequest);
  server.get('/api/requests/stats', RequestController.getRequestStats);

  // Routes notifications
  server.get('/api/notifications', NotificationController.getUserNotifications);
  server.get('/api/notifications/:id', NotificationController.getNotification);
  server.put('/api/notifications/:id/read', NotificationController.markAsRead);
  server.put('/api/notifications/read-all', NotificationController.markAllAsRead);
  server.delete('/api/notifications/:id', NotificationController.deleteNotification);
  server.delete('/api/notifications', NotificationController.deleteAllNotifications);
  server.get('/api/notifications/unread/count', NotificationController.getUnreadCount);

  // Root route
  server.get('/', async () => {
    return { message: 'Welcome to Remisage API' };
  });
} 