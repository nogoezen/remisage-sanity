import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationModel } from '../models/NotificationSanity';

export class NotificationSanityController {
  static async getUserNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Récupérer les notifications de l'utilisateur
      const notifications = await NotificationModel.findByUser(userId);

      return reply.send({ notifications });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des notifications' });
    }
  }

  static async getNotification(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer la notification
      const notification = await NotificationModel.findById(id);
      if (!notification) {
        return reply.status(404).send({ error: 'Notification non trouvée' });
      }

      // Vérifier si l'utilisateur est autorisé à voir cette notification
      if (notification.userId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      return reply.send({ notification });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération de la notification' });
    }
  }

  static async markAsRead(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer la notification
      const notification = await NotificationModel.findById(id);
      if (!notification) {
        return reply.status(404).send({ error: 'Notification non trouvée' });
      }

      // Vérifier si l'utilisateur est autorisé à marquer cette notification comme lue
      if (notification.userId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Marquer la notification comme lue
      const success = await NotificationModel.markAsRead(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors du marquage de la notification comme lue' });
      }

      return reply.send({ message: 'Notification marquée comme lue avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors du marquage de la notification comme lue' });
    }
  }

  static async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Marquer toutes les notifications comme lues
      const success = await NotificationModel.markAllAsRead(userId);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors du marquage de toutes les notifications comme lues' });
      }

      return reply.send({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors du marquage de toutes les notifications comme lues' });
    }
  }

  static async deleteNotification(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer la notification
      const notification = await NotificationModel.findById(id);
      if (!notification) {
        return reply.status(404).send({ error: 'Notification non trouvée' });
      }

      // Vérifier si l'utilisateur est autorisé à supprimer cette notification
      if (notification.userId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Supprimer la notification
      const success = await NotificationModel.delete(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la suppression de la notification' });
      }

      return reply.send({ message: 'Notification supprimée avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression de la notification' });
    }
  }

  static async deleteAllNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Supprimer toutes les notifications de l'utilisateur
      const success = await NotificationModel.deleteAllForUser(userId);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la suppression de toutes les notifications' });
      }

      return reply.send({ message: 'Toutes les notifications ont été supprimées' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression de toutes les notifications' });
    }
  }

  static async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Compter les notifications non lues
      const count = await NotificationModel.countUnread(userId);

      return reply.send({ count });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors du comptage des notifications non lues' });
    }
  }
} 