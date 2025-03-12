import { User, UserWithRelations, Vehicle, Message, Request, Notification } from './interfaces';

// Interfaces pour les modèles Sanity avec ID de type string
export interface SanityUser extends Omit<User, 'id'> {
  id: string;
}

export interface SanityVehicle extends Omit<Vehicle, 'id' | 'assignedTo'> {
  id: string;
  assignedTo: string | null;
}

export interface SanityMessage extends Omit<Message, 'id' | 'senderId' | 'receiverId'> {
  id: string;
  senderId: string;
  receiverId: string;
}

export interface SanityRequest extends Omit<Request, 'id' | 'userId' | 'vehicleId' | 'resolvedBy' | 'requestedDate'> {
  id: string;
  userId: string;
  vehicleId: string | null;
  resolvedBy: string | null;
  requestedDate: Date | null;
}

export interface SanityNotification extends Omit<Notification, 'id' | 'userId' | 'relatedVehicleId' | 'relatedRequestId' | 'relatedMessageId'> {
  id: string;
  userId: string;
  relatedVehicleId: string | null;
  relatedRequestId: string | null;
  relatedMessageId: string | null;
}

export interface SanityUserWithRelations extends Omit<UserWithRelations, 'id' | 'vehicles' | 'messages' | 'requests' | 'notifications'> {
  id: string;
  vehicles: SanityVehicle[];
  messages: SanityMessage[];
  requests: SanityRequest[];
  notifications: SanityNotification[];
} 