import { Notification, NotificationType } from '../services/notificationService';
import notificationService from '../services/notificationService';

/**
 * Crée une notification pour un message reçu
 * @param messageId ID du message
 * @param senderId ID de l'expéditeur
 * @param senderName Nom de l'expéditeur
 * @param subject Sujet du message
 * @param userId ID de l'utilisateur destinataire
 */
export const createMessageNotification = async (
  messageId: number,
  senderId: number,
  senderName: string,
  subject: string,
  userId: number
): Promise<void> => {
  try {
    const notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      type: 'message_received',
      title: 'Nouveau message',
      message: `Vous avez reçu un message de ${senderName}: ${subject}`,
      relatedMessageId: messageId
    };
    
    // Dans une implémentation réelle, nous enverrions cette notification au serveur
    // qui la créerait et la renverrait via WebSocket
    console.log('Notification de message créée:', notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification de message:', error);
  }
};

/**
 * Crée une notification pour un changement de localisation de véhicule
 * @param vehicleId ID du véhicule
 * @param vehicleModel Modèle du véhicule
 * @param address Nouvelle adresse
 * @param userId ID de l'utilisateur destinataire
 */
export const createLocationChangeNotification = async (
  vehicleId: number,
  vehicleModel: string,
  address: string,
  userId: number
): Promise<void> => {
  try {
    const notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      type: 'location_change',
      title: 'Changement d\'adresse',
      message: `L'adresse de remisage du véhicule ${vehicleModel} a été modifiée: ${address}`,
      relatedVehicleId: vehicleId
    };
    
    console.log('Notification de changement d\'adresse créée:', notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification de changement d\'adresse:', error);
  }
};

/**
 * Crée une notification pour une assignation de véhicule
 * @param vehicleId ID du véhicule
 * @param vehicleModel Modèle du véhicule
 * @param licensePlate Plaque d'immatriculation
 * @param userId ID de l'utilisateur destinataire
 */
export const createVehicleAssignmentNotification = async (
  vehicleId: number,
  vehicleModel: string,
  licensePlate: string,
  userId: number
): Promise<void> => {
  try {
    const notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      type: 'vehicle_assignment',
      title: 'Véhicule assigné',
      message: `Un véhicule ${vehicleModel} (${licensePlate}) vous a été assigné.`,
      relatedVehicleId: vehicleId
    };
    
    console.log('Notification d\'assignation de véhicule créée:', notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification d\'assignation de véhicule:', error);
  }
};

/**
 * Crée une notification pour une mise à jour de demande
 * @param requestId ID de la demande
 * @param status Nouveau statut de la demande
 * @param userId ID de l'utilisateur destinataire
 */
export const createRequestUpdateNotification = async (
  requestId: number,
  status: 'approved' | 'rejected' | 'completed',
  userId: number
): Promise<void> => {
  try {
    const statusText = status === 'approved' ? 'approuvée' : 
                       status === 'rejected' ? 'rejetée' : 'complétée';
    
    const notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      type: 'request_update',
      title: 'Mise à jour de demande',
      message: `Votre demande a été ${statusText}.`,
      relatedRequestId: requestId
    };
    
    console.log('Notification de mise à jour de demande créée:', notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification de mise à jour de demande:', error);
  }
};

/**
 * Crée une notification pour une alerte de maintenance
 * @param vehicleId ID du véhicule
 * @param vehicleModel Modèle du véhicule
 * @param maintenanceType Type de maintenance
 * @param userId ID de l'utilisateur destinataire
 */
export const createMaintenanceAlertNotification = async (
  vehicleId: number,
  vehicleModel: string,
  maintenanceType: string,
  userId: number
): Promise<void> => {
  try {
    const notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      type: 'maintenance_alert',
      title: 'Alerte de maintenance',
      message: `Une maintenance de type "${maintenanceType}" est requise pour votre véhicule ${vehicleModel}.`,
      relatedVehicleId: vehicleId
    };
    
    console.log('Notification d\'alerte de maintenance créée:', notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification d\'alerte de maintenance:', error);
  }
}; 