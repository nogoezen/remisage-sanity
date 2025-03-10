import { sanityClient, extractId } from '../config/sanity';
import { Notification } from './interfaces';
import { SanityNotification } from './sanityInterfaces';

export class NotificationModel {
  static async findById(id: string): Promise<SanityNotification | null> {
    try {
      const notification = await sanityClient.fetch(
        `*[_type == "notification" && _id == $id][0]`,
        { id: `notification-${id}` }
      );
      return notification ? this.transformSanityNotification(notification) : null;
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      return null;
    }
  }

  static async create(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<SanityNotification> {
    try {
      const notificationDoc: any = {
        _type: 'notification',
        user: {
          _type: 'reference',
          _ref: `user-${notificationData.userId}`
        },
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        isRead: notificationData.isRead || false
      };

      // Ajouter les références aux entités liées si disponibles
      if (notificationData.relatedVehicleId) {
        notificationDoc.relatedVehicle = {
          _type: 'reference',
          _ref: `vehicle-${notificationData.relatedVehicleId}`
        };
      }

      if (notificationData.relatedRequestId) {
        notificationDoc.relatedRequest = {
          _type: 'reference',
          _ref: `request-${notificationData.relatedRequestId}`
        };
      }

      if (notificationData.relatedMessageId) {
        notificationDoc.relatedMessage = {
          _type: 'reference',
          _ref: `message-${notificationData.relatedMessageId}`
        };
      }

      const newNotification = await sanityClient.create(notificationDoc);
      return this.transformSanityNotification(newNotification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async update(id: string, notificationData: Partial<Notification>): Promise<boolean> {
    try {
      const updateData: any = { ...notificationData };
      
      // Traiter la référence à l'utilisateur si nécessaire
      if (updateData.userId) {
        updateData.user = {
          _type: 'reference',
          _ref: `user-${updateData.userId}`
        };
        delete updateData.userId;
      }
      
      // Traiter les références aux entités liées si nécessaire
      if (updateData.relatedVehicleId !== undefined) {
        if (updateData.relatedVehicleId) {
          updateData.relatedVehicle = {
            _type: 'reference',
            _ref: `vehicle-${updateData.relatedVehicleId}`
          };
        } else {
          updateData.relatedVehicle = null;
        }
        delete updateData.relatedVehicleId;
      }
      
      if (updateData.relatedRequestId !== undefined) {
        if (updateData.relatedRequestId) {
          updateData.relatedRequest = {
            _type: 'reference',
            _ref: `request-${updateData.relatedRequestId}`
          };
        } else {
          updateData.relatedRequest = null;
        }
        delete updateData.relatedRequestId;
      }
      
      if (updateData.relatedMessageId !== undefined) {
        if (updateData.relatedMessageId) {
          updateData.relatedMessage = {
            _type: 'reference',
            _ref: `message-${updateData.relatedMessageId}`
          };
        } else {
          updateData.relatedMessage = null;
        }
        delete updateData.relatedMessageId;
      }

      const result = await sanityClient.patch(`notification-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating notification:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await sanityClient.delete(`notification-${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  static async findByUser(userId: string): Promise<SanityNotification[]> {
    try {
      const notifications = await sanityClient.fetch(
        `*[_type == "notification" && user._ref == $userId] | order(_createdAt desc)`,
        { userId: `user-${userId}` }
      );
      return notifications.map(this.transformSanityNotification);
    } catch (error) {
      console.error('Error finding notifications by user:', error);
      return [];
    }
  }

  static async markAsRead(id: string): Promise<boolean> {
    try {
      const result = await sanityClient.patch(`notification-${id}`)
        .set({ isRead: true })
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const notifications = await this.findByUser(userId);
      const unreadNotifications = notifications.filter(notification => !notification.isRead);
      
      if (unreadNotifications.length === 0) {
        return true;
      }
      
      const promises = unreadNotifications.map(notification => 
        this.markAsRead(notification.id)
      );
      
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async deleteAllForUser(userId: string): Promise<boolean> {
    try {
      const notifications = await this.findByUser(userId);
      
      if (notifications.length === 0) {
        return true;
      }
      
      const promises = notifications.map(notification => 
        this.delete(notification.id)
      );
      
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('Error deleting all notifications for user:', error);
      return false;
    }
  }

  static async countUnread(userId: string): Promise<number> {
    try {
      const result = await sanityClient.fetch(
        `count(*[_type == "notification" && user._ref == $userId && isRead == false])`,
        { userId: `user-${userId}` }
      );
      return result;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  // Méthode de transformation pour convertir les documents Sanity en objets du modèle
  private static transformSanityNotification(sanityNotification: any): SanityNotification {
    return {
      id: extractId(sanityNotification._id),
      userId: extractId(sanityNotification.user._ref),
      type: sanityNotification.type,
      title: sanityNotification.title,
      message: sanityNotification.message,
      isRead: sanityNotification.isRead,
      relatedVehicleId: sanityNotification.relatedVehicle ? extractId(sanityNotification.relatedVehicle._ref) : null,
      relatedRequestId: sanityNotification.relatedRequest ? extractId(sanityNotification.relatedRequest._ref) : null,
      relatedMessageId: sanityNotification.relatedMessage ? extractId(sanityNotification.relatedMessage._ref) : null,
      createdAt: new Date(sanityNotification._createdAt)
    };
  }
} 