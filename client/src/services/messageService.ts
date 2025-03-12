import api from './api';

// Interface pour un message
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  subject: string;
  content: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  // Propriétés supplémentaires issues des jointures
  senderFirstName?: string;
  senderLastName?: string;
  receiverFirstName?: string;
  receiverLastName?: string;
}

// Interface pour la création d'un message
export interface CreateMessageData {
  senderId: number;
  receiverId: number;
  subject: string;
  content: string;
}

// Interface pour la mise à jour d'un message
export interface UpdateMessageData {
  isRead?: boolean;
  isArchived?: boolean;
}

// Service pour les messages
const messageService = {
  // Récupérer tous les messages
  getAll: async (): Promise<Message[]> => {
    try {
      const response = await api.get('/messages');
      
      // Vérifier si la réponse est un tableau, sinon extraire les données
      let messages = [];
      if (Array.isArray(response.data)) {
        messages = response.data;
      } else if (response.data && response.data.messages && Array.isArray(response.data.messages)) {
        messages = response.data.messages;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
      
      // Éliminer les doublons en utilisant un Map avec l'ID comme clé
      const messageMap = new Map<number, Message>();
      messages.forEach((message: any) => {
        messageMap.set(message.id, message);
      });
      
      // Convertir le Map en tableau
      return Array.from(messageMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  },

  // Récupérer tous les messages d'un utilisateur
  getByUserId: async (userId: number): Promise<Message[]> => {
    const response = await api.get(`/messages/user/${userId}`);
    return response.data;
  },

  // Récupérer le nombre de messages non lus
  getUnreadCount: async (userId: number): Promise<number> => {
    const response = await api.get(`/messages/user/${userId}/unread`);
    return response.data.unreadCount;
  },

  // Récupérer un message par son ID
  getById: async (id: number): Promise<Message> => {
    try {
      const response = await api.get(`/messages/${id}`);
      // Vérifier si la réponse contient un objet message
      if (response.data && response.data.message) {
        return response.data.message;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        throw new Error('Format de réponse inattendu');
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du message ${id}:`, error);
      throw error;
    }
  },

  // Envoyer un nouveau message
  send: async (messageData: CreateMessageData): Promise<Message> => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Marquer un message comme lu
  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/messages/${id}`, { isRead: true });
  },

  // Archiver un message
  archive: async (id: number): Promise<void> => {
    await api.put(`/messages/${id}`, { isArchived: true });
  },

  // Désarchiver un message
  unarchive: async (id: number): Promise<void> => {
    await api.put(`/messages/${id}`, { isArchived: false });
  },

  // Mettre à jour un message
  update: async (id: number, updateData: UpdateMessageData): Promise<void> => {
    await api.put(`/messages/${id}`, updateData);
  },

  // Supprimer un message
  delete: async (id: number): Promise<void> => {
    await api.delete(`/messages/${id}`);
  }
};

export default messageService; 