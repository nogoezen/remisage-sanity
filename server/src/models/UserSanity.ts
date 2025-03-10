import { sanityClient, extractId } from '../config/sanity';
import { User } from './interfaces';
import { SanityUser, SanityUserWithRelations, SanityVehicle, SanityMessage, SanityRequest, SanityNotification } from './sanityInterfaces';
import { hashPassword, comparePassword } from '../utils/auth';

export class UserModel {
  static async findById(id: string): Promise<SanityUser | null> {
    try {
      const user = await sanityClient.fetch(
        `*[_type == "user" && _id == $id][0]`,
        { id: `user-${id}` }
      );
      return user ? this.transformSanityUser(user) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<SanityUser | null> {
    try {
      const user = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]`,
        { email }
      );
      return user ? this.transformSanityUser(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<SanityUser> {
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await sanityClient.create({
        _type: 'user',
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        has_vehicle_assigned: userData.has_vehicle_assigned !== undefined ? userData.has_vehicle_assigned : true,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      });
      
      return this.transformSanityUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id: string, userData: Partial<User>): Promise<boolean> {
    try {
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const updateData: any = {
        ...userData,
        _updatedAt: new Date().toISOString()
      };
      
      const result = await sanityClient.patch(`user-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await sanityClient.delete(`user-${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  static async findAll(): Promise<SanityUser[]> {
    try {
      const users = await sanityClient.fetch(
        `*[_type == "user"] | order(lastName asc, firstName asc)`
      );
      return users.map(this.transformSanityUser);
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  static async findWithRelations(id: string): Promise<SanityUserWithRelations | null> {
    try {
      const user = await this.findById(id);
      if (!user) return null;

      const [vehicles, messages, requests, notifications] = await Promise.all([
        sanityClient.fetch(
          `*[_type == "vehicle" && assignedTo._ref == $userId]`,
          { userId: `user-${id}` }
        ),
        sanityClient.fetch(
          `*[_type == "message" && (sender._ref == $userId || receiver._ref == $userId)] | order(_createdAt desc)`,
          { userId: `user-${id}` }
        ),
        sanityClient.fetch(
          `*[_type == "request" && user._ref == $userId] | order(_createdAt desc)`,
          { userId: `user-${id}` }
        ),
        sanityClient.fetch(
          `*[_type == "notification" && user._ref == $userId] | order(_createdAt desc)`,
          { userId: `user-${id}` }
        )
      ]);

      return {
        ...user,
        vehicles: vehicles.map(this.transformSanityVehicle),
        messages: messages.map(this.transformSanityMessage),
        requests: requests.map(this.transformSanityRequest),
        notifications: notifications.map(this.transformSanityNotification)
      };
    } catch (error) {
      console.error('Error finding user with relations:', error);
      return null;
    }
  }

  static async authenticate(email: string, password: string): Promise<SanityUser | null> {
    try {
      console.log(`Tentative d'authentification pour l'email: ${email}`);
      
      const user = await this.findByEmail(email);
      if (!user) {
        console.log(`Utilisateur non trouvé pour l'email: ${email}`);
        return null;
      }
      
      console.log(`Utilisateur trouvé:`, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        has_vehicle_assigned: user.has_vehicle_assigned
      });
      
      const isValid = await comparePassword(password, user.password);
      console.log(`Mot de passe valide: ${isValid}`);
      
      return isValid ? user : null;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return null;
    }
  }

  // Méthodes de transformation pour convertir les documents Sanity en objets du modèle
  private static transformSanityUser(sanityUser: any): SanityUser {
    return {
      id: extractId(sanityUser._id),
      firstName: sanityUser.firstName,
      lastName: sanityUser.lastName,
      email: sanityUser.email,
      password: sanityUser.password,
      role: sanityUser.role,
      has_vehicle_assigned: sanityUser.has_vehicle_assigned,
      createdAt: new Date(sanityUser._createdAt),
      updatedAt: new Date(sanityUser._updatedAt)
    };
  }

  private static transformSanityVehicle(sanityVehicle: any): SanityVehicle {
    return {
      id: extractId(sanityVehicle._id),
      model: sanityVehicle.model,
      licensePlate: sanityVehicle.licensePlate,
      status: sanityVehicle.status,
      address: sanityVehicle.address,
      latitude: sanityVehicle.location?.lat,
      longitude: sanityVehicle.location?.lng,
      assignedTo: sanityVehicle.assignedTo ? extractId(sanityVehicle.assignedTo._ref) : null,
      createdAt: new Date(sanityVehicle._createdAt),
      updatedAt: new Date(sanityVehicle._updatedAt)
    };
  }

  private static transformSanityMessage(sanityMessage: any): SanityMessage {
    return {
      id: extractId(sanityMessage._id),
      senderId: extractId(sanityMessage.sender._ref),
      receiverId: extractId(sanityMessage.receiver._ref),
      subject: sanityMessage.subject,
      content: sanityMessage.content,
      isRead: sanityMessage.isRead,
      isArchived: sanityMessage.isArchived,
      createdAt: new Date(sanityMessage._createdAt)
    };
  }

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

  private static transformSanityNotification(sanityNotification: any): SanityNotification {
    return {
      id: extractId(sanityNotification._id),
      userId: extractId(sanityNotification.user._ref),
      type: sanityNotification.type,
      title: sanityNotification.title,
      message: sanityNotification.message,
      isRead: sanityNotification.isRead,
      relatedVehicleId: sanityNotification.relatedVehicle ? extractId(sanityNotification.relatedVehicle._ref) : null,
      relatedRequestId: sanityNotification.relatedRequest ? extractId(sanityNotification.relatedRequest._ref) : null,
      relatedMessageId: sanityNotification.relatedMessage ? extractId(sanityNotification.relatedMessage._ref) : null,
      createdAt: new Date(sanityNotification._createdAt)
    };
  }
} 