import api from './api';
import axios from 'axios';

// Interface pour un véhicule
export interface Vehicle {
  id: number;
  model: string;
  licensePlate: string;
  status: 'available' | 'assigned' | 'maintenance';
  address?: string;
  latitude?: number;
  longitude?: number;
  assignedTo?: number;
  createdAt?: string;
  updatedAt?: string;
  // Propriétés supplémentaires issues des jointures
  firstName?: string;
  lastName?: string;
}

// Interface pour l'historique de localisation
export interface LocationHistory {
  id: number;
  vehicleId: number;
  address: string;
  latitude: number;
  longitude: number;
  updatedBy: number;
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

// Fonction utilitaire pour normaliser les données de véhicule
const normalizeVehicle = (vehicle: any): Vehicle => {
  // Vérifier si l'objet véhicule existe
  if (!vehicle) {
    console.error('Vehicle object is null or undefined in normalizeVehicle');
    return {
      id: 0,
      model: '',
      licensePlate: '',
      status: 'available'
    };
  }
  
  // Log pour débogage
  console.log('Normalizing vehicle (raw):', JSON.stringify(vehicle, null, 2));
  
  // S'assurer que l'ID est un nombre
  let numericId: number;
  
  // Cas spécial pour les IDs Sanity qui peuvent être au format "vehicle-123"
  if (typeof vehicle._id === 'string' && vehicle._id.startsWith('vehicle-')) {
    const idPart = vehicle._id.split('-')[1];
    numericId = Number(idPart);
    console.log(`Extracted numeric ID ${numericId} from Sanity ID ${vehicle._id}`);
  } else if (vehicle.id === undefined || vehicle.id === null) {
    console.error('Vehicle ID is undefined or null in normalizeVehicle');
    numericId = 0;
  } else {
    // Convertir l'ID en nombre, même s'il est fourni sous forme de chaîne
    numericId = Number(vehicle.id);
    if (isNaN(numericId)) {
      console.error(`Failed to convert vehicle ID to number: ${vehicle.id}`);
      numericId = 0;
    }
  }
  
  const normalizedVehicle = {
    ...vehicle,
    // Remplacer l'ID par la version numérique
    id: numericId,
    // S'assurer que latitude et longitude sont des nombres
    latitude: vehicle.latitude ? Number(vehicle.latitude) : (vehicle.location?.lat ? Number(vehicle.location.lat) : undefined),
    longitude: vehicle.longitude ? Number(vehicle.longitude) : (vehicle.location?.lng ? Number(vehicle.location.lng) : undefined),
    // S'assurer que assignedTo est un nombre si présent
    assignedTo: vehicle.assignedTo ? 
      (typeof vehicle.assignedTo === 'object' && vehicle.assignedTo._ref ? 
        Number(vehicle.assignedTo._ref.split('-')[1]) : 
        Number(vehicle.assignedTo)
      ) : undefined
  };
  
  console.log('Normalized vehicle:', JSON.stringify(normalizedVehicle, null, 2));
  return normalizedVehicle;
};

// Fonction utilitaire pour normaliser les données d'historique de localisation
const normalizeLocationHistory = (history: any): LocationHistory => {
  return {
    ...history,
    // S'assurer que latitude et longitude sont des nombres
    latitude: Number(history.latitude),
    longitude: Number(history.longitude),
  };
};

// Service pour les véhicules
const vehicleService = {
  // Récupérer tous les véhicules
  getAll: async (): Promise<Vehicle[]> => {
    try {
      const response = await api.get('/vehicles');
      console.log('Vehicle service - getAll response:', response.data);
      
      // Vérifier si la réponse est un tableau, sinon extraire les données
      let vehicles = [];
      if (Array.isArray(response.data)) {
        console.log('Response is an array');
        vehicles = response.data;
      } else if (response.data && response.data.vehicles && Array.isArray(response.data.vehicles)) {
        console.log('Response has vehicles array property');
        vehicles = response.data.vehicles;
      } else if (response.data && typeof response.data === 'object') {
        console.log('Response is an object, trying to extract values');
        // Essayer d'extraire les valeurs si c'est un objet
        vehicles = Object.values(response.data);
        if (!Array.isArray(vehicles[0])) {
          console.log('First value is not an array, using values directly');
        } else {
          console.log('First value is an array, flattening');
          vehicles = vehicles[0];
        }
      } else {
        console.error('Format de réponse inattendu:', response.data);
        return [];
      }
      
      console.log('Vehicles before normalization:', vehicles);
      
      // Normaliser les données et éliminer les doublons en utilisant un Map avec l'ID comme clé
      const vehicleMap = new Map<number, Vehicle>();
      vehicles.forEach((vehicle: any) => {
        const normalizedVehicle = normalizeVehicle(vehicle);
        if (normalizedVehicle.id > 0) {
          vehicleMap.set(normalizedVehicle.id, normalizedVehicle);
        } else {
          console.error('Skipping vehicle with invalid ID:', vehicle);
        }
      });
      
      // Convertir le Map en tableau
      const result = Array.from(vehicleMap.values());
      console.log('Final normalized vehicles:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      return [];
    }
  },

  // Récupérer un véhicule par son ID
  getById: async (id: number): Promise<Vehicle> => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return normalizeVehicle(response.data);
    } catch (error) {
      console.error(`Erreur lors de la récupération du véhicule ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les véhicules assignés à un utilisateur
  getByUserId: async (userId: number): Promise<Vehicle[]> => {
    try {
      const response = await api.get(`/vehicles/user/${userId}`);
      return Array.isArray(response.data) 
        ? response.data.map(normalizeVehicle) 
        : [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des véhicules de l'utilisateur ${userId}:`, error);
      return [];
    }
  },

  // Créer un nouveau véhicule
  create: async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
    try {
      console.log('Envoi des données pour création de véhicule:', JSON.stringify(vehicleData, null, 2));
      const response = await api.post('/vehicles', vehicleData);

      console.log('Réponse complète du serveur:', response);
      
      // Gérer différents formats de réponse possibles
      let vehicleResponse;
      if (response.data && response.data.vehicle) {
        console.log('Format de réponse: { vehicle: {...} }');
        vehicleResponse = response.data.vehicle;
      } else if (response.data && response.data.id) {
        console.log('Format de réponse: { id: ..., model: ..., ... }');
        vehicleResponse = response.data;
      } else {
        console.error('Format de réponse non reconnu:', response.data);
        throw new Error('Format de réponse non reconnu');
      }
      
      console.log('Véhicule créé avec succès:', vehicleResponse);
      const normalizedVehicle = normalizeVehicle(vehicleResponse);
      console.log('Véhicule normalisé:', normalizedVehicle);
      return normalizedVehicle;
    } catch (error: any) {
      console.error('Erreur lors de la création du véhicule:', error);
      
      // Extraire le message d'erreur de la réponse du serveur si disponible
      if (error.response?.data?.error) {
        console.error('Message d\'erreur du serveur:', error.response.data.error);
        throw new Error(error.response.data.error);
      }
      
      if (error.response?.data?.details) {
        console.error('Détails de l\'erreur:', error.response.data.details);
      }
      
      throw error;
    }
  },

  // Mettre à jour un véhicule
  update: async (id: number | string, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      // Validation de l'ID
      if (id === undefined || id === null) {
        console.error('Vehicle ID is undefined or null in update method');
        throw new Error('ID du véhicule non valide');
      }
      
      // Convertir l'ID en nombre si c'est une chaîne
      let numericId: number;
      
      // Cas spécial pour les IDs Sanity qui peuvent être au format "vehicle-123"
      if (typeof id === 'string' && id.startsWith('vehicle-')) {
        const idPart = id.split('-')[1];
        numericId = Number(idPart);
        console.log(`Extracted numeric ID ${numericId} from Sanity ID ${id}`);
      } else {
        numericId = typeof id === 'string' ? Number(id) : id;
        if (isNaN(numericId)) {
          console.error(`Failed to convert vehicle ID to number: ${id}`);
          throw new Error('ID du véhicule non valide');
        }
      }
      
      if (numericId <= 0) {
        console.error(`Invalid numeric ID: ${numericId}`);
        throw new Error('ID du véhicule non valide');
      }
      
      console.log(`Mise à jour du véhicule avec l'ID: ${numericId}`, JSON.stringify(vehicleData, null, 2));
      const response = await api.put(`/vehicles/${numericId}`, vehicleData);
      
      console.log('Réponse de mise à jour:', JSON.stringify(response.data, null, 2));
      return normalizeVehicle(response.data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du véhicule ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un véhicule
  delete: async (id: number | string): Promise<void> => {
    try {
      // Validation de l'ID
      if (id === undefined || id === null) {
        console.error('Vehicle ID is undefined or null in delete method');
        throw new Error('ID du véhicule non valide');
      }
      
      // Convertir l'ID en nombre si c'est une chaîne
      let numericId: number;
      
      // Cas spécial pour les IDs Sanity qui peuvent être au format "vehicle-123"
      if (typeof id === 'string' && id.startsWith('vehicle-')) {
        const idPart = id.split('-')[1];
        numericId = Number(idPart);
        console.log(`Extracted numeric ID ${numericId} from Sanity ID ${id}`);
      } else {
        numericId = typeof id === 'string' ? Number(id) : id;
        if (isNaN(numericId)) {
          console.error(`Failed to convert vehicle ID to number: ${id}`);
          throw new Error('ID du véhicule non valide');
        }
      }
      
      console.log(`Suppression du véhicule avec l'ID: ${numericId}`);
      await api.delete(`/vehicles/${numericId}`);
      console.log(`Véhicule ${numericId} supprimé avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du véhicule ${id}:`, error);
      throw error;
    }
  },

  // Assigner un véhicule à un utilisateur
  assignToUser: async (vehicleId: number | string, userId: number | string): Promise<Vehicle> => {
    try {
      // Validation de l'ID du véhicule
      if (vehicleId === undefined || vehicleId === null) {
        console.error('Vehicle ID is undefined or null in assignToUser method');
        throw new Error('ID du véhicule non valide');
      }
      
      // Convertir l'ID du véhicule en nombre si c'est une chaîne
      let numericVehicleId: number;
      
      // Cas spécial pour les IDs Sanity qui peuvent être au format "vehicle-123"
      if (typeof vehicleId === 'string' && vehicleId.startsWith('vehicle-')) {
        const idPart = vehicleId.split('-')[1];
        numericVehicleId = Number(idPart);
        console.log(`Extracted numeric ID ${numericVehicleId} from Sanity ID ${vehicleId}`);
      } else {
        numericVehicleId = typeof vehicleId === 'string' ? Number(vehicleId) : vehicleId;
        if (isNaN(numericVehicleId)) {
          console.error(`Failed to convert vehicle ID to number: ${vehicleId}`);
          throw new Error('ID du véhicule non valide');
        }
      }
      
      // Convertir l'ID de l'utilisateur en nombre si c'est une chaîne
      const numericUserId = userId === 0 ? null : (typeof userId === 'string' ? Number(userId) : userId);
      
      console.log(`Service vehicleService - assignToUser: Assignation du véhicule ${numericVehicleId} à l'utilisateur ${numericUserId}`);
      const response = await api.post(`/vehicles/${numericVehicleId}/assign`, { userId: numericUserId });
      
      if (!response.data || !response.data.vehicle) {
        console.error('Service vehicleService - assignToUser: Réponse invalide:', response.data);
        throw new Error('Réponse invalide du serveur');
      }
      
      return normalizeVehicle(response.data.vehicle);
    } catch (error) {
      console.error(`Erreur lors de l'assignation du véhicule ${vehicleId} à l'utilisateur ${userId}:`, error);
      throw error;
    }
  },

  // Mettre à jour la localisation d'un véhicule
  updateLocation: async (
    vehicleId: number | string, 
    address: string, 
    latitude: number, 
    longitude: number,
    previousAddress?: string,
    previousLatitude?: number,
    previousLongitude?: number
  ): Promise<Vehicle> => {
    try {
      // Validation plus détaillée du vehicleId
      if (vehicleId === undefined || vehicleId === null) {
        console.error('Vehicle ID is undefined or null');
        throw new Error('ID du véhicule non valide');
      }
      
      // Convertir l'ID en nombre si c'est une chaîne
      let numericVehicleId: number;
      
      // Cas spécial pour les IDs Sanity qui peuvent être au format "vehicle-123"
      if (typeof vehicleId === 'string' && vehicleId.startsWith('vehicle-')) {
        const idPart = vehicleId.split('-')[1];
        numericVehicleId = Number(idPart);
        console.log(`Extracted numeric ID ${numericVehicleId} from Sanity ID ${vehicleId}`);
      } else {
        numericVehicleId = typeof vehicleId === 'string' ? Number(vehicleId) : vehicleId;
        if (isNaN(numericVehicleId)) {
          console.error(`Failed to convert vehicle ID to number: ${vehicleId}`);
          throw new Error('ID du véhicule non valide');
        }
      }
      
      console.log('Updating vehicle location:', { 
        vehicleId: numericVehicleId, 
        address, 
        latitude, 
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      });
      
      // Préparer les données à envoyer au serveur
      const payload = {
        address, 
        latitude, 
        longitude,
        // Inclure les valeurs précédentes si elles sont fournies
        ...(previousAddress && { previousAddress }),
        ...(previousLatitude && { previousLatitude }),
        ...(previousLongitude && { previousLongitude })
      };
      
      // Utiliser PUT car c'est ce que le serveur attend dans index.ts
      const response = await api.put(`/vehicles/${numericVehicleId}/location`, payload);
      console.log('Update location response:', response.data);
      
      // Gérer différents formats de réponse possibles
      if (response.data) {
        if (response.data.vehicle) {
          // Format: { vehicle: {...} }
          return normalizeVehicle(response.data.vehicle);
        } else if (response.data.id) {
          // Format: { id: ..., model: ..., ... }
          return normalizeVehicle(response.data);
        } else {
          console.error('Format de réponse non reconnu:', response.data);
          throw new Error('Format de réponse non reconnu');
        }
      } else {
        console.error('Réponse vide du serveur');
        throw new Error('Réponse vide du serveur');
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la localisation du véhicule ${vehicleId}:`, error);
      throw error;
    }
  },

  // Récupérer l'historique de localisation d'un véhicule
  getLocationHistory: async (vehicleId: number): Promise<LocationHistory[]> => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/location-history`);
      return Array.isArray(response.data) 
        ? response.data.map(normalizeLocationHistory) 
        : [];
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique de localisation du véhicule ${vehicleId}:`, error);
      return [];
    }
  }
};

export default vehicleService; 