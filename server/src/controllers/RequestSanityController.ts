import { FastifyRequest, FastifyReply } from 'fastify';
import { RequestModel } from '../models/RequestSanity';
import { VehicleModel } from '../models/VehicleSanity';

export class RequestSanityController {
  static async createRequest(request: FastifyRequest<{
    Body: {
      type: 'vehicle_change' | 'location_change' | 'schedule_change' | 'maintenance' | 'other';
      details: string;
      vehicleId?: string;
      requestedDate?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { type, details, vehicleId, requestedDate } = request.body;
      const userId = request.user.id;

      // Vérifier si le véhicule existe (si fourni)
      if (vehicleId) {
        const vehicle = await VehicleModel.findById(vehicleId);
        if (!vehicle) {
          return reply.status(404).send({ error: 'Véhicule non trouvé' });
        }
      }

      // Créer la demande
      const requestObj = await RequestModel.create({
        userId,
        type,
        details,
        vehicleId,
        requestedDate: requestedDate ? new Date(requestedDate) : undefined,
        status: 'pending'
      });

      return reply.status(201).send({ request: requestObj });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la création de la demande' });
    }
  }

  static async getRequest(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const isAdmin = request.user.role === 'admin';

      // Récupérer la demande
      const requestObj = await RequestModel.findById(id);
      if (!requestObj) {
        return reply.status(404).send({ error: 'Demande non trouvée' });
      }

      // Vérifier si l'utilisateur est autorisé à voir cette demande
      if (!isAdmin && requestObj.userId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      return reply.send({ request: requestObj });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération de la demande' });
    }
  }

  static async getUserRequests(request: FastifyRequest<{
    Querystring: {
      status?: 'pending' | 'approved' | 'rejected' | 'completed';
    };
  }>, reply: FastifyReply) {
    try {
      const { status } = request.query;
      const userId = request.user.id;

      // Récupérer les demandes de l'utilisateur
      let requests = await RequestModel.findByUser(userId);

      // Filtrer par statut si nécessaire
      if (status) {
        requests = requests.filter(req => req.status === status);
      }

      return reply.send({ requests });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des demandes' });
    }
  }

  static async getAllRequests(request: FastifyRequest<{
    Querystring: {
      status?: 'pending' | 'approved' | 'rejected' | 'completed';
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { status } = request.query;

      // Récupérer toutes les demandes ou filtrer par statut
      let requests;
      if (status) {
        requests = await RequestModel.findByStatus(status);
      } else {
        requests = await RequestModel.findAll();
      }

      return reply.send({ requests });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des demandes' });
    }
  }

  static async updateRequestStatus(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      status: 'pending' | 'approved' | 'rejected' | 'completed';
      adminResponse?: string;
    };
  }>, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      const { id } = request.params;
      const { status, adminResponse } = request.body;
      const resolvedBy = request.user.id;

      // Vérifier si la demande existe
      const requestObj = await RequestModel.findById(id);
      if (!requestObj) {
        return reply.status(404).send({ error: 'Demande non trouvée' });
      }

      // Mettre à jour le statut de la demande
      const success = await RequestModel.updateStatus(id, status, adminResponse, resolvedBy);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la mise à jour du statut de la demande' });
      }

      // Récupérer la demande mise à jour
      const updatedRequest = await RequestModel.findById(id);
      return reply.send({ request: updatedRequest });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du statut de la demande' });
    }
  }

  static async deleteRequest(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const isAdmin = request.user.role === 'admin';

      // Récupérer la demande
      const requestObj = await RequestModel.findById(id);
      if (!requestObj) {
        return reply.status(404).send({ error: 'Demande non trouvée' });
      }

      // Vérifier si l'utilisateur est autorisé à supprimer cette demande
      if (!isAdmin && requestObj.userId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Supprimer la demande
      const success = await RequestModel.delete(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la suppression de la demande' });
      }

      return reply.send({ message: 'Demande supprimée avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression de la demande' });
    }
  }

  static async getRequestStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Récupérer les statistiques des demandes
      const stats = await RequestModel.getStats();

      return reply.send({ stats });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des statistiques des demandes' });
    }
  }
} 