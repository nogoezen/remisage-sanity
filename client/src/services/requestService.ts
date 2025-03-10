import api from './api';

// Types de demandes
export type RequestType = 'vehicle_change' | 'location_change' | 'schedule_change' | 'maintenance' | 'other';

// Statut des demandes
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

// Interface pour une demande
export interface Request {
  id: number;
  userId: number;
  type: RequestType;
  details: string;
  vehicleId?: number;
  requestedDate?: string;
  status: RequestStatus;
  adminResponse?: string;
  resolvedBy?: number;
  createdAt: string;
  updatedAt: string;
  // Propriétés supplémentaires issues des jointures
  userFirstName?: string;
  userLastName?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  adminFirstName?: string;
  adminLastName?: string;
}

// Interface pour la création d'une demande
export interface CreateRequestData {
  userId: number;
  type: RequestType;
  details: string;
  vehicleId?: number;
  requestedDate?: string;
}

// Interface pour la mise à jour d'une demande
export interface UpdateRequestData {
  status?: RequestStatus;
  adminResponse?: string;
  resolvedBy?: number;
}

// Service pour les demandes
const requestService = {
  // Récupérer toutes les demandes (admin uniquement)
  getAll: async (): Promise<Request[]> => {
    try {
      const response = await api.get('/requests');
      
      // Vérifier si la réponse est un tableau, sinon extraire les données
      let requests = [];
      if (Array.isArray(response.data)) {
        requests = response.data;
      } else if (response.data && response.data.requests && Array.isArray(response.data.requests)) {
        requests = response.data.requests;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
      
      // Éliminer les doublons en utilisant un Map avec l'ID comme clé
      const requestMap = new Map<number, Request>();
      requests.forEach((request: any) => {
        requestMap.set(request.id, request);
      });
      
      // Convertir le Map en tableau
      return Array.from(requestMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      return [];
    }
  },

  // Récupérer les demandes d'un utilisateur
  getByUserId: async (userId: number): Promise<Request[]> => {
    const response = await api.get(`/requests/user/${userId}`);
    return response.data;
  },

  // Récupérer une demande par son ID
  getById: async (id: number): Promise<Request> => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  // Créer une nouvelle demande
  create: async (requestData: CreateRequestData): Promise<Request> => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  // Mettre à jour une demande (admin uniquement)
  update: async (id: number, updateData: UpdateRequestData): Promise<Request> => {
    const response = await api.put(`/requests/${id}`, updateData);
    return response.data;
  },

  // Approuver une demande
  approve: async (id: number, adminResponse: string, resolvedBy: number): Promise<Request> => {
    return await requestService.update(id, {
      status: 'approved',
      adminResponse,
      resolvedBy
    });
  },

  // Rejeter une demande
  reject: async (id: number, adminResponse: string, resolvedBy: number): Promise<Request> => {
    return await requestService.update(id, {
      status: 'rejected',
      adminResponse,
      resolvedBy
    });
  },

  // Marquer une demande comme complétée
  complete: async (id: number): Promise<Request> => {
    return await requestService.update(id, { status: 'completed' });
  },

  // Supprimer une demande
  delete: async (id: number): Promise<void> => {
    await api.delete(`/requests/${id}`);
  }
};

export default requestService; 