import api from './api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: string;
  updatedAt: string;
}

// Fonction pour normaliser les données utilisateur
const normalizeUser = (userData: any): User => {
  return {
    id: userData.id,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    role: userData.role || 'employee',
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString()
  };
};

// Service pour gérer les utilisateurs
const userService = {
  // Récupérer tous les utilisateurs
  getAll: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      
      // Vérifier le format de la réponse (tableau ou objet avec propriété users)
      let usersData: any[] = [];
      
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
      
      // Normaliser les données et éliminer les doublons en utilisant un Map avec l'ID comme clé
      const userMap = new Map<number, User>();
      usersData.forEach((user: any) => {
        userMap.set(user.id, normalizeUser(user));
      });
      
      // Convertir le Map en tableau
      return Array.from(userMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },

  // Récupérer un utilisateur par son ID
  getById: async (id: number): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return normalizeUser(response.data);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
      throw error;
    }
  },

  // Récupérer tous les employés (utilisateurs avec le rôle 'employee')
  getAllEmployees: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users?role=employee');
      
      // Vérifier le format de la réponse (tableau ou objet avec propriété users)
      let usersData: any[] = [];
      
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
      
      // Normaliser les données et éliminer les doublons en utilisant un Map avec l'ID comme clé
      const userMap = new Map<number, User>();
      usersData.forEach((user: any) => {
        userMap.set(user.id, normalizeUser(user));
      });
      
      // Convertir le Map en tableau
      return Array.from(userMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des employés:', error);
      throw error;
    }
  },

  // Créer un nouvel utilisateur
  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return normalizeUser(response.data);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  // Mettre à jour un utilisateur
  update: async (id: number, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return normalizeUser(response.data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un utilisateur
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error);
      throw error;
    }
  }
};

export default userService; 