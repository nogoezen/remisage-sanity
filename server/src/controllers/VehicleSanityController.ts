import { FastifyRequest, FastifyReply } from 'fastify';
import { VehicleModel } from '../models/VehicleSanity';
import { UserModel } from '../models/UserSanity';

export class VehicleSanityController {
  static async createVehicle(request: FastifyRequest<{
    Body: {
      model: string;
      licensePlate: string;
      status?: 'available' | 'assigned' | 'maintenance';
      address?: string;
      latitude?: string | number;
      longitude?: string | number;
      assignedTo?: string;
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { model, licensePlate, status, address, latitude, longitude, assignedTo } = request.body;

      // Vérifier si la plaque d'immatriculation existe déjà
      const existingVehicle = await VehicleModel.findByLicensePlate(licensePlate);
      if (existingVehicle) {
        return reply.status(400).send({ error: 'Cette plaque d\'immatriculation est déjà utilisée' });
      }

      // Vérifier si l'utilisateur assigné existe
      if (assignedTo) {
        const user = await UserModel.findById(assignedTo);
        if (!user) {
          return reply.status(400).send({ error: 'L\'utilisateur assigné n\'existe pas' });
        }
      }

      // Convertir latitude et longitude en nombres si nécessaire
      const numLatitude = latitude !== undefined ? Number(latitude) : undefined;
      const numLongitude = longitude !== undefined ? Number(longitude) : undefined;

      // Créer le véhicule
      const vehicle = await VehicleModel.create({
        model,
        licensePlate,
        status: status || 'available',
        address,
        latitude: numLatitude,
        longitude: numLongitude,
        assignedTo
      });

      return reply.status(201).send({ vehicle });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la création du véhicule' });
    }
  }

  static async getVehicle(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Récupérer le véhicule
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      return reply.send({ vehicle });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération du véhicule' });
    }
  }

  static async updateVehicle(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      model?: string;
      licensePlate?: string;
      status?: 'available' | 'assigned' | 'maintenance';
      address?: string;
      latitude?: string | number;
      longitude?: string | number;
      assignedTo?: string | null;
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { id } = request.params;
      const { model, licensePlate, status, address, latitude, longitude, assignedTo } = request.body;

      // Vérifier si le véhicule existe
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      // Vérifier si la plaque d'immatriculation existe déjà (si elle est modifiée)
      if (licensePlate && licensePlate !== vehicle.licensePlate) {
        const existingVehicle = await VehicleModel.findByLicensePlate(licensePlate);
        if (existingVehicle) {
          return reply.status(400).send({ error: 'Cette plaque d\'immatriculation est déjà utilisée' });
        }
      }

      // Vérifier si l'utilisateur assigné existe
      if (assignedTo) {
        const user = await UserModel.findById(assignedTo);
        if (!user) {
          return reply.status(400).send({ error: 'L\'utilisateur assigné n\'existe pas' });
        }
      }

      // Convertir latitude et longitude en nombres si nécessaire
      const numLatitude = latitude !== undefined ? Number(latitude) : undefined;
      const numLongitude = longitude !== undefined ? Number(longitude) : undefined;

      // Mettre à jour le véhicule
      const success = await VehicleModel.update(id, {
        model,
        licensePlate,
        status,
        address,
        latitude: numLatitude,
        longitude: numLongitude,
        assignedTo
      });

      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la mise à jour du véhicule' });
      }

      // Récupérer le véhicule mis à jour
      const updatedVehicle = await VehicleModel.findById(id);
      return reply.send({ vehicle: updatedVehicle });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du véhicule' });
    }
  }

  static async deleteVehicle(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { id } = request.params;

      // Vérifier si le véhicule existe
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      // Supprimer le véhicule
      const success = await VehicleModel.delete(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la suppression du véhicule' });
      }

      return reply.send({ message: 'Véhicule supprimé avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression du véhicule' });
    }
  }

  static async getAllVehicles(request: FastifyRequest<{
    Querystring: {
      status?: 'available' | 'assigned' | 'maintenance';
      userId?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { status, userId } = request.query;

      let vehicles;

      if (status) {
        vehicles = await VehicleModel.findByStatus(status);
      } else if (userId) {
        vehicles = await VehicleModel.findByUser(userId);
      } else {
        vehicles = await VehicleModel.findAll();
      }

      return reply.send({ vehicles });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des véhicules' });
    }
  }

  static async updateLocation(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      address: string;
      latitude: number;
      longitude: number;
      previousAddress?: string;
      previousLatitude?: number;
      previousLongitude?: number;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { address, latitude, longitude } = request.body;
      const userId = request.user.id;

      // Vérifier si le véhicule existe
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à mettre à jour la localisation
      if (request.user.role !== 'admin' && vehicle.assignedTo !== userId) {
        return reply.status(403).send({ error: 'Vous n\'êtes pas autorisé à mettre à jour la localisation de ce véhicule' });
      }

      // Mettre à jour la localisation
      const success = await VehicleModel.updateLocation(id, address, latitude, longitude, userId);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la mise à jour de la localisation' });
      }

      // Récupérer le véhicule mis à jour
      const updatedVehicle = await VehicleModel.findById(id);
      if (!updatedVehicle) {
        return reply.status(500).send({ error: 'Erreur lors de la récupération du véhicule mis à jour' });
      }

      return reply.send({ vehicle: updatedVehicle });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour de la localisation' });
    }
  }

  static async getLocationHistory(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Vérifier si le véhicule existe
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      // Récupérer l'historique des localisations
      const history = await VehicleModel.getLocationHistory(id);

      return reply.send({ history });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération de l\'historique des localisations' });
    }
  }

  static async assignToUser(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      userId: string | null;
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { id } = request.params;
      const { userId } = request.body;

      // Vérifier si le véhicule existe
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return reply.status(404).send({ error: 'Véhicule non trouvé' });
      }

      // Vérifier si l'utilisateur existe (si userId n'est pas null)
      if (userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
          return reply.status(400).send({ error: 'L\'utilisateur n\'existe pas' });
        }
      }

      // Assigner le véhicule à l'utilisateur
      const success = await VehicleModel.assignToUser(id, userId);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de l\'assignation du véhicule' });
      }

      // Récupérer le véhicule mis à jour
      const updatedVehicle = await VehicleModel.findById(id);
      if (!updatedVehicle) {
        return reply.status(500).send({ error: 'Erreur lors de la récupération du véhicule mis à jour' });
      }

      return reply.send({ vehicle: updatedVehicle });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de l\'assignation du véhicule' });
    }
  }
} 