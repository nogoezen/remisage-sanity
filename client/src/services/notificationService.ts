import api from './api';

// Types de notifications
export type NotificationType = 'vehicle_assignment' | 'location_change' | 'request_update' | 'message_received' | 'maintenance_alert';

// Interface pour une notification
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedVehicleId?: number;
  relatedRequestId?: number;
  relatedMessageId?: number;
  createdAt: string;
}

// Service pour les notifications
const notificationService = {
  // Récupérer toutes les notifications de l'utilisateur
  getAll: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications');
      if (response.data && response.data.notifications && Array.isArray(response.data.notifications)) {
        return response.data.notifications;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  },

  // Récupérer le nombre de notifications non lues
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread/count');
      if (response.data && typeof response.data.count === 'number') {
        return response.data.count;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return 0;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      return 0;
    }
  },

  // Récupérer une notification par son ID
  getById: async (id: number): Promise<Notification | null> => {
    try {
      const response = await api.get(`/notifications/${id}`);
      if (response.data && response.data.notification) {
        return response.data.notification;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de la notification ${id}:`, error);
      return null;
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (id: number): Promise<void> => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error(`Erreur lors du marquage de la notification ${id} comme lue:`, error);
      throw error;
    }
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      throw error;
    }
  },

  // Supprimer une notification
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la notification ${id}:`, error);
      throw error;
    }
  },

  // Supprimer toutes les notifications
  deleteAll: async (): Promise<void> => {
    try {
      await api.delete('/notifications');
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
      throw error;
    }
  }
};

export default notificationService; 