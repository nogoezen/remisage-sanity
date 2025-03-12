import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import notificationService, { Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Charger les notifications au démarrage et lorsque l'utilisateur change
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Configurer un intervalle pour vérifier les nouvelles notifications
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [user]);

  // Récupérer les notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      await fetchUnreadCount();
      setInitialized(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Récupérer le nombre de notifications non lues
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      setUnreadCount(0);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      
      // Mettre à jour le compteur
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Réinitialiser le compteur
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: number) => {
    try {
      await notificationService.delete(id);
      
      // Mettre à jour l'état local
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Mettre à jour le compteur si la notification n'était pas lue
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  // Supprimer toutes les notifications
  const deleteAllNotifications = async () => {
    try {
      await notificationService.deleteAll();
      
      // Mettre à jour l'état local
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
    }
  };

  // Ajouter une nouvelle notification (utilisé pour les tests ou les notifications en temps réel)
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 