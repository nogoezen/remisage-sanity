export interface BaseModel {
  id: number | string;
  createdAt: Date;
}

export interface TimestampedModel extends BaseModel {
  updatedAt: Date;
}

export interface User extends TimestampedModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  has_vehicle_assigned: boolean;
}

export interface Vehicle extends TimestampedModel {
  model: string;
  licensePlate: string;
  status: 'available' | 'assigned' | 'maintenance';
  address?: string;
  latitude?: number;
  longitude?: number;
  assignedTo?: string | number | null;
}

export interface VehicleLocationHistory extends BaseModel {
  vehicleId: number;
  address: string;
  latitude: number;
  longitude: number;
  updatedBy: number;
  firstName?: string;
  lastName?: string;
}

export interface Message extends BaseModel {
  senderId: number | string;
  receiverId: number | string;
  subject: string;
  content: string;
  isRead: boolean;
  isArchived: boolean;
}

export interface Request extends TimestampedModel {
  userId: number | string;
  type: 'vehicle_change' | 'location_change' | 'schedule_change' | 'maintenance' | 'other';
  details: string;
  vehicleId?: number | string | null;
  requestedDate?: Date | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminResponse?: string;
  resolvedBy?: number | string | null;
}

export interface Notification extends BaseModel {
  userId: number | string;
  type: 'vehicle_assignment' | 'location_change' | 'request_update' | 'message_received' | 'maintenance_alert';
  title: string;
  message: string;
  isRead: boolean;
  relatedVehicleId?: number | string | null;
  relatedRequestId?: number | string | null;
  relatedMessageId?: number | string | null;
}

// Types pour les relations
export interface UserWithRelations extends User {
  vehicles?: Vehicle[];
  messages?: Message[];
  requests?: Request[];
  notifications?: Notification[];
}

export interface VehicleWithRelations extends Vehicle {
  assignedUser?: User;
  locationHistory?: VehicleLocationHistory[];
  requests?: Request[];
  notifications?: Notification[];
}

export interface MessageWithRelations extends Message {
  sender: User;
  receiver: User;
  notifications?: Notification[];
}

export interface RequestWithRelations extends Request {
  user: User;
  vehicle?: Vehicle;
  resolver?: User;
  notifications?: Notification[];
}

export interface NotificationWithRelations extends Notification {
  user: User;
  relatedVehicle?: Vehicle;
  relatedRequest?: Request;
  relatedMessage?: Message;
} 