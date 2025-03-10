import { sanityClient, extractId } from '../config/sanity';
import { Vehicle } from './interfaces';
import { SanityVehicle } from './sanityInterfaces';

export class VehicleModel {
  static async findById(id: string): Promise<SanityVehicle | null> {
    try {
      const vehicle = await sanityClient.fetch(
        `*[_type == "vehicle" && _id == $id][0]`,
        { id: `vehicle-${id}` }
      );
      return vehicle ? this.transformSanityVehicle(vehicle) : null;
    } catch (error) {
      console.error('Error finding vehicle by ID:', error);
      return null;
    }
  }

  static async findByLicensePlate(licensePlate: string): Promise<SanityVehicle | null> {
    try {
      const vehicle = await sanityClient.fetch(
        `*[_type == "vehicle" && licensePlate == $licensePlate][0]`,
        { licensePlate }
      );
      return vehicle ? this.transformSanityVehicle(vehicle) : null;
    } catch (error) {
      console.error('Error finding vehicle by license plate:', error);
      return null;
    }
  }

  static async create(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<SanityVehicle> {
    try {
      // Générer un ID unique basé sur un timestamp
      const timestamp = Date.now();
      const vehicleId = `vehicle-${timestamp}`;
      
      console.log(`Création d'un véhicule avec l'ID: ${vehicleId}`);
      
      const vehicleDoc: any = {
        _id: vehicleId, // Spécifier explicitement l'ID
        _type: 'vehicle',
        model: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        status: vehicleData.status || 'available',
        address: vehicleData.address
      };

      // Ajouter la localisation si disponible
      if (vehicleData.latitude && vehicleData.longitude) {
        vehicleDoc.location = {
          _type: 'geopoint',
          lat: vehicleData.latitude,
          lng: vehicleData.longitude
        };
      }

      // Ajouter la référence à l'utilisateur assigné si disponible
      if (vehicleData.assignedTo) {
        vehicleDoc.assignedTo = {
          _type: 'reference',
          _ref: `user-${vehicleData.assignedTo}`
        };
      }

      // Utiliser createOrReplace au lieu de create pour s'assurer que l'ID est respecté
      const newVehicle = await sanityClient.createOrReplace(vehicleDoc);
      console.log(`Véhicule créé avec succès avec l'ID: ${newVehicle._id}`);
      
      return this.transformSanityVehicle(newVehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  static async update(id: string, vehicleData: Partial<Vehicle>): Promise<boolean> {
    try {
      const updateData: any = { ...vehicleData };
      
      // Traiter la localisation si latitude et longitude sont fournies
      if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
        updateData.location = {
          _type: 'geopoint',
          lat: updateData.latitude,
          lng: updateData.longitude
        };
        delete updateData.latitude;
        delete updateData.longitude;
      }

      // Traiter l'assignation à un utilisateur
      if (updateData.assignedTo !== undefined) {
        if (updateData.assignedTo) {
          updateData.assignedTo = {
            _type: 'reference',
            _ref: `user-${updateData.assignedTo}`
          };
        } else {
          updateData.assignedTo = null;
        }
      }

      const result = await sanityClient.patch(`vehicle-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await sanityClient.delete(`vehicle-${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return false;
    }
  }

  static async findAll(): Promise<SanityVehicle[]> {
    try {
      const vehicles = await sanityClient.fetch(
        `*[_type == "vehicle"] | order(model asc)`
      );
      return vehicles.map(this.transformSanityVehicle);
    } catch (error) {
      console.error('Error finding all vehicles:', error);
      return [];
    }
  }

  static async findByStatus(status: string): Promise<SanityVehicle[]> {
    try {
      const vehicles = await sanityClient.fetch(
        `*[_type == "vehicle" && status == $status] | order(model asc)`,
        { status }
      );
      return vehicles.map(this.transformSanityVehicle);
    } catch (error) {
      console.error(`Error finding vehicles by status ${status}:`, error);
      return [];
    }
  }

  static async findByUser(userId: string): Promise<SanityVehicle[]> {
    try {
      const vehicles = await sanityClient.fetch(
        `*[_type == "vehicle" && assignedTo._ref == $userId] | order(model asc)`,
        { userId: `user-${userId}` }
      );
      return vehicles.map(this.transformSanityVehicle);
    } catch (error) {
      console.error(`Error finding vehicles for user ${userId}:`, error);
      return [];
    }
  }

  static async updateLocation(id: string, address: string, latitude: number, longitude: number, updatedBy: string): Promise<boolean> {
    try {
      console.log('Updating vehicle location in Sanity:', { id, address, latitude, longitude, updatedBy });
      
      // Mettre à jour la localisation du véhicule directement avec les données formatées pour Sanity
      const result = await sanityClient.patch(`vehicle-${id}`)
        .set({
          address,
          location: {
            _type: 'geopoint',
            lat: latitude,
            lng: longitude
          }
        })
        .commit();

      if (!result) {
        console.error('Failed to update vehicle location in Sanity');
        return false;
      }

      console.log('Vehicle location updated successfully in Sanity');

      // Créer une entrée dans l'historique des localisations
      const historyEntry = await sanityClient.create({
        _type: 'vehicleLocationHistory',
        vehicle: {
          _type: 'reference',
          _ref: `vehicle-${id}`
        },
        updatedBy: {
          _type: 'reference',
          _ref: `user-${updatedBy}`
        },
        address,
        location: {
          _type: 'geopoint',
          lat: latitude,
          lng: longitude
        }
      });

      console.log('Vehicle location history entry created:', historyEntry._id);

      return true;
    } catch (error) {
      console.error('Error updating vehicle location:', error);
      return false;
    }
  }

  static async getLocationHistory(id: string): Promise<any[]> {
    try {
      const history = await sanityClient.fetch(
        `*[_type == "vehicleLocationHistory" && vehicle._ref == $vehicleId] | order(_createdAt desc)`,
        { vehicleId: `vehicle-${id}` }
      );
      
      return history.map((entry: any) => ({
        id: extractId(entry._id),
        vehicleId: extractId(entry.vehicle._ref),
        address: entry.address,
        latitude: entry.location?.lat,
        longitude: entry.location?.lng,
        updatedBy: extractId(entry.updatedBy._ref),
        createdAt: new Date(entry._createdAt)
      }));
    } catch (error) {
      console.error('Error getting vehicle location history:', error);
      return [];
    }
  }

  static async assignToUser(vehicleId: string, userId: string | null): Promise<boolean> {
    try {
      const vehicle = await this.findById(vehicleId);
      if (!vehicle) {
        return false;
      }

      const updateData: any = {
        status: userId ? 'assigned' : 'available'
      };

      if (userId) {
        updateData.assignedTo = {
          _type: 'reference',
          _ref: `user-${userId}`
        };
      } else {
        updateData.assignedTo = null;
      }

      const result = await sanityClient.patch(`vehicle-${vehicleId}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error assigning vehicle to user:', error);
      return false;
    }
  }

  // Méthode de transformation pour convertir les documents Sanity en objets du modèle
  private static transformSanityVehicle(sanityVehicle: any): SanityVehicle {
    if (!sanityVehicle) {
      console.error('transformSanityVehicle: sanityVehicle is null or undefined');
      throw new Error('Cannot transform null or undefined vehicle');
    }
    
    // Vérifier si l'ID est au format attendu
    const id = sanityVehicle._id || '';
    const extractedId = extractId(id);
    
    if (!extractedId) {
      console.warn(`transformSanityVehicle: Could not extract ID from ${id}`);
    }
    
    return {
      id: extractedId,
      model: sanityVehicle.model || '',
      licensePlate: sanityVehicle.licensePlate || '',
      status: sanityVehicle.status || 'available',
      address: sanityVehicle.address || '',
      latitude: sanityVehicle.location?.lat || null,
      longitude: sanityVehicle.location?.lng || null,
      assignedTo: sanityVehicle.assignedTo ? extractId(sanityVehicle.assignedTo._ref) : null,
      createdAt: sanityVehicle._createdAt ? new Date(sanityVehicle._createdAt) : new Date(),
      updatedAt: sanityVehicle._updatedAt ? new Date(sanityVehicle._updatedAt) : new Date()
    };
  }
} 