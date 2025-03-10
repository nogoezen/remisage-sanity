import { sanityClient, extractId } from '../config/sanity';
import { Request } from './interfaces';
import { SanityRequest } from './sanityInterfaces';

export class RequestModel {
  static async findById(id: string): Promise<SanityRequest | null> {
    try {
      const request = await sanityClient.fetch(
        `*[_type == "request" && _id == $id][0]`,
        { id: `request-${id}` }
      );
      return request ? this.transformSanityRequest(request) : null;
    } catch (error) {
      console.error('Error finding request by ID:', error);
      return null;
    }
  }

  static async create(requestData: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>): Promise<SanityRequest> {
    try {
      const requestDoc: any = {
        _type: 'request',
        user: {
          _type: 'reference',
          _ref: `user-${requestData.userId}`
        },
        type: requestData.type,
        details: requestData.details,
        status: requestData.status || 'pending',
        adminResponse: requestData.adminResponse
      };

      // Ajouter la référence au véhicule si disponible
      if (requestData.vehicleId) {
        requestDoc.vehicle = {
          _type: 'reference',
          _ref: `vehicle-${requestData.vehicleId}`
        };
      }

      // Ajouter la date demandée si disponible
      if (requestData.requestedDate) {
        requestDoc.requestedDate = requestData.requestedDate.toISOString().split('T')[0];
      }

      // Ajouter la référence à l'utilisateur qui a résolu la demande si disponible
      if (requestData.resolvedBy) {
        requestDoc.resolvedBy = {
          _type: 'reference',
          _ref: `user-${requestData.resolvedBy}`
        };
      }

      const newRequest = await sanityClient.create(requestDoc);
      return this.transformSanityRequest(newRequest);
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  static async update(id: string, requestData: Partial<Request>): Promise<boolean> {
    try {
      const updateData: any = { ...requestData };
      
      // Traiter la référence à l'utilisateur si nécessaire
      if (updateData.userId) {
        updateData.user = {
          _type: 'reference',
          _ref: `user-${updateData.userId}`
        };
        delete updateData.userId;
      }
      
      // Traiter la référence au véhicule si nécessaire
      if (updateData.vehicleId !== undefined) {
        if (updateData.vehicleId) {
          updateData.vehicle = {
            _type: 'reference',
            _ref: `vehicle-${updateData.vehicleId}`
          };
        } else {
          updateData.vehicle = null;
        }
        delete updateData.vehicleId;
      }
      
      // Traiter la date demandée si nécessaire
      if (updateData.requestedDate) {
        updateData.requestedDate = updateData.requestedDate.toISOString().split('T')[0];
      }
      
      // Traiter la référence à l'utilisateur qui a résolu la demande si nécessaire
      if (updateData.resolvedBy !== undefined) {
        if (updateData.resolvedBy) {
          updateData.resolvedBy = {
            _type: 'reference',
            _ref: `user-${updateData.resolvedBy}`
          };
        } else {
          updateData.resolvedBy = null;
        }
        delete updateData.resolvedBy;
      }

      const result = await sanityClient.patch(`request-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating request:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await sanityClient.delete(`request-${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      return false;
    }
  }

  static async findAll(): Promise<SanityRequest[]> {
    try {
      const requests = await sanityClient.fetch(
        `*[_type == "request"] | order(_createdAt desc)`
      );
      return requests.map(this.transformSanityRequest);
    } catch (error) {
      console.error('Error finding all requests:', error);
      return [];
    }
  }

  static async findByUser(userId: string): Promise<SanityRequest[]> {
    try {
      const requests = await sanityClient.fetch(
        `*[_type == "request" && user._ref == $userId] | order(_createdAt desc)`,
        { userId: `user-${userId}` }
      );
      return requests.map(this.transformSanityRequest);
    } catch (error) {
      console.error('Error finding requests by user:', error);
      return [];
    }
  }

  static async findByStatus(status: string): Promise<SanityRequest[]> {
    try {
      const requests = await sanityClient.fetch(
        `*[_type == "request" && status == $status] | order(_createdAt desc)`,
        { status }
      );
      return requests.map(this.transformSanityRequest);
    } catch (error) {
      console.error('Error finding requests by status:', error);
      return [];
    }
  }

  static async updateStatus(id: string, status: string, adminResponse?: string, resolvedBy?: string): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
      }
      
      if (resolvedBy) {
        updateData.resolvedBy = {
          _type: 'reference',
          _ref: `user-${resolvedBy}`
        };
      }

      const result = await sanityClient.patch(`request-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating request status:', error);
      return false;
    }
  }

  static async getStats(): Promise<any> {
    try {
      const stats = await sanityClient.fetch(`{
        "total": count(*[_type == "request"]),
        "pending": count(*[_type == "request" && status == "pending"]),
        "approved": count(*[_type == "request" && status == "approved"]),
        "rejected": count(*[_type == "request" && status == "rejected"]),
        "completed": count(*[_type == "request" && status == "completed"]),
        "byType": {
          "vehicle_change": count(*[_type == "request" && type == "vehicle_change"]),
          "location_change": count(*[_type == "request" && type == "location_change"]),
          "schedule_change": count(*[_type == "request" && type == "schedule_change"]),
          "maintenance": count(*[_type == "request" && type == "maintenance"]),
          "other": count(*[_type == "request" && type == "other"])
        }
      }`);
      
      return stats;
    } catch (error) {
      console.error('Error getting request stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        byType: {
          vehicle_change: 0,
          location_change: 0,
          schedule_change: 0,
          maintenance: 0,
          other: 0
        }
      };
    }
  }

  // Méthode de transformation pour convertir les documents Sanity en objets du modèle
  private static transformSanityRequest(sanityRequest: any): SanityRequest {
    return {
      id: extractId(sanityRequest._id),
      userId: extractId(sanityRequest.user._ref),
      type: sanityRequest.type,
      details: sanityRequest.details,
      vehicleId: sanityRequest.vehicle ? extractId(sanityRequest.vehicle._ref) : null,
      requestedDate: sanityRequest.requestedDate ? new Date(sanityRequest.requestedDate) : null,
      status: sanityRequest.status,
      adminResponse: sanityRequest.adminResponse,
      resolvedBy: sanityRequest.resolvedBy ? extractId(sanityRequest.resolvedBy._ref) : null,
      createdAt: new Date(sanityRequest._createdAt),
      updatedAt: new Date(sanityRequest._updatedAt)
    };
  }
} 