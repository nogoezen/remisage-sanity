import { db } from '../config/database';
import { sanityClient } from '../config/sanity';
import { RowDataPacket } from 'mysql2';
import { hashPassword } from './auth';

/**
 * Script pour migrer les données de MySQL vers Sanity
 */
async function migrateToSanity() {
  try {
    console.log('Début de la migration des données vers Sanity...');
    
    // Migrer les utilisateurs
    await migrateUsers();
    
    // Migrer les véhicules
    await migrateVehicles();
    
    // Migrer l'historique des localisations
    await migrateVehicleLocationHistory();
    
    // Migrer les messages
    await migrateMessages();
    
    // Migrer les demandes
    await migrateRequests();
    
    // Migrer les notifications
    await migrateNotifications();
    
    console.log('Migration terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion à la base de données
    await db.end();
    process.exit(0);
  }
}

/**
 * Migrer les utilisateurs de MySQL vers Sanity
 */
async function migrateUsers() {
  console.log('Migration des utilisateurs...');
  
  const [users] = await db.execute<RowDataPacket[]>('SELECT * FROM users');
  
  for (const user of users) {
    try {
      // Vérifier si l'utilisateur existe déjà dans Sanity
      const existingUser = await sanityClient.fetch(
        `*[_type == "user" && email == $email][0]`,
        { email: user.email }
      );
      
      if (existingUser) {
        console.log(`L'utilisateur ${user.email} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingUser._id)
          .set({
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password, // Le mot de passe est déjà hashé dans MySQL
            role: user.role,
            has_vehicle_assigned: user.has_vehicle_assigned === 1,
            _updatedAt: new Date().toISOString()
          })
          .commit();
      } else {
        console.log(`Création de l'utilisateur ${user.email} dans Sanity...`);
        
        await sanityClient.create({
          _id: `user-${user.id}`,
          _type: 'user',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password, // Le mot de passe est déjà hashé dans MySQL
          role: user.role,
          has_vehicle_assigned: user.has_vehicle_assigned === 1,
          _createdAt: user.createdAt.toISOString(),
          _updatedAt: user.updatedAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration de l'utilisateur ${user.email}:`, error);
    }
  }
  
  console.log(`${users.length} utilisateurs migrés.`);
}

/**
 * Migrer les véhicules de MySQL vers Sanity
 */
async function migrateVehicles() {
  console.log('Migration des véhicules...');
  
  const [vehicles] = await db.execute<RowDataPacket[]>('SELECT * FROM vehicles');
  
  for (const vehicle of vehicles) {
    try {
      // Vérifier si le véhicule existe déjà dans Sanity
      const existingVehicle = await sanityClient.fetch(
        `*[_type == "vehicle" && licensePlate == $licensePlate][0]`,
        { licensePlate: vehicle.licensePlate }
      );
      
      const vehicleData: any = {
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        address: vehicle.address
      };
      
      // Ajouter la localisation si disponible
      if (vehicle.latitude && vehicle.longitude) {
        vehicleData.location = {
          _type: 'geopoint',
          lat: parseFloat(vehicle.latitude),
          lng: parseFloat(vehicle.longitude)
        };
      }
      
      // Ajouter la référence à l'utilisateur assigné si disponible
      if (vehicle.assignedTo) {
        vehicleData.assignedTo = {
          _type: 'reference',
          _ref: `user-${vehicle.assignedTo}`
        };
      }
      
      if (existingVehicle) {
        console.log(`Le véhicule ${vehicle.licensePlate} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingVehicle._id)
          .set({
            ...vehicleData,
            _updatedAt: new Date().toISOString()
          })
          .commit();
      } else {
        console.log(`Création du véhicule ${vehicle.licensePlate} dans Sanity...`);
        
        await sanityClient.create({
          _id: `vehicle-${vehicle.id}`,
          _type: 'vehicle',
          ...vehicleData,
          _createdAt: vehicle.createdAt.toISOString(),
          _updatedAt: vehicle.updatedAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration du véhicule ${vehicle.licensePlate}:`, error);
    }
  }
  
  console.log(`${vehicles.length} véhicules migrés.`);
}

/**
 * Migrer l'historique des localisations de MySQL vers Sanity
 */
async function migrateVehicleLocationHistory() {
  console.log('Migration de l\'historique des localisations...');
  
  const [locations] = await db.execute<RowDataPacket[]>('SELECT * FROM vehicle_location_history');
  
  for (const location of locations) {
    try {
      // Vérifier si l'entrée existe déjà dans Sanity
      const existingLocation = await sanityClient.fetch(
        `*[_type == "vehicleLocationHistory" && vehicle._ref == $vehicleId && _createdAt == $createdAt][0]`,
        { 
          vehicleId: `vehicle-${location.vehicleId}`,
          createdAt: location.createdAt.toISOString()
        }
      );
      
      const locationData = {
        vehicle: {
          _type: 'reference',
          _ref: `vehicle-${location.vehicleId}`
        },
        updatedBy: {
          _type: 'reference',
          _ref: `user-${location.updatedBy}`
        },
        address: location.address,
        location: {
          _type: 'geopoint',
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude)
        }
      };
      
      if (existingLocation) {
        console.log(`L'entrée d'historique pour le véhicule ${location.vehicleId} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingLocation._id)
          .set(locationData)
          .commit();
      } else {
        console.log(`Création d'une entrée d'historique pour le véhicule ${location.vehicleId} dans Sanity...`);
        
        await sanityClient.create({
          _id: `vehicleLocationHistory-${location.id}`,
          _type: 'vehicleLocationHistory',
          ...locationData,
          _createdAt: location.createdAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration de l'historique de localisation ${location.id}:`, error);
    }
  }
  
  console.log(`${locations.length} entrées d'historique migrées.`);
}

/**
 * Migrer les messages de MySQL vers Sanity
 */
async function migrateMessages() {
  console.log('Migration des messages...');
  
  const [messages] = await db.execute<RowDataPacket[]>('SELECT * FROM messages');
  
  for (const message of messages) {
    try {
      // Vérifier si le message existe déjà dans Sanity
      const existingMessage = await sanityClient.fetch(
        `*[_type == "message" && _id == $id][0]`,
        { id: `message-${message.id}` }
      );
      
      const messageData = {
        sender: {
          _type: 'reference',
          _ref: `user-${message.senderId}`
        },
        receiver: {
          _type: 'reference',
          _ref: `user-${message.receiverId}`
        },
        subject: message.subject,
        content: message.content,
        isRead: message.isRead === 1,
        isArchived: message.isArchived === 1
      };
      
      if (existingMessage) {
        console.log(`Le message ${message.id} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingMessage._id)
          .set(messageData)
          .commit();
      } else {
        console.log(`Création du message ${message.id} dans Sanity...`);
        
        await sanityClient.create({
          _id: `message-${message.id}`,
          _type: 'message',
          ...messageData,
          _createdAt: message.createdAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration du message ${message.id}:`, error);
    }
  }
  
  console.log(`${messages.length} messages migrés.`);
}

/**
 * Migrer les demandes de MySQL vers Sanity
 */
async function migrateRequests() {
  console.log('Migration des demandes...');
  
  const [requests] = await db.execute<RowDataPacket[]>('SELECT * FROM requests');
  
  for (const request of requests) {
    try {
      // Vérifier si la demande existe déjà dans Sanity
      const existingRequest = await sanityClient.fetch(
        `*[_type == "request" && _id == $id][0]`,
        { id: `request-${request.id}` }
      );
      
      const requestData: any = {
        user: {
          _type: 'reference',
          _ref: `user-${request.userId}`
        },
        type: request.type,
        details: request.details,
        status: request.status,
        adminResponse: request.adminResponse
      };
      
      // Ajouter la référence au véhicule si disponible
      if (request.vehicleId) {
        requestData.vehicle = {
          _type: 'reference',
          _ref: `vehicle-${request.vehicleId}`
        };
      }
      
      // Ajouter la date demandée si disponible
      if (request.requestedDate) {
        requestData.requestedDate = request.requestedDate.toISOString().split('T')[0];
      }
      
      // Ajouter la référence à l'utilisateur qui a résolu la demande si disponible
      if (request.resolvedBy) {
        requestData.resolvedBy = {
          _type: 'reference',
          _ref: `user-${request.resolvedBy}`
        };
      }
      
      if (existingRequest) {
        console.log(`La demande ${request.id} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingRequest._id)
          .set({
            ...requestData,
            _updatedAt: request.updatedAt.toISOString()
          })
          .commit();
      } else {
        console.log(`Création de la demande ${request.id} dans Sanity...`);
        
        await sanityClient.create({
          _id: `request-${request.id}`,
          _type: 'request',
          ...requestData,
          _createdAt: request.createdAt.toISOString(),
          _updatedAt: request.updatedAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration de la demande ${request.id}:`, error);
    }
  }
  
  console.log(`${requests.length} demandes migrées.`);
}

/**
 * Migrer les notifications de MySQL vers Sanity
 */
async function migrateNotifications() {
  console.log('Migration des notifications...');
  
  const [notifications] = await db.execute<RowDataPacket[]>('SELECT * FROM notifications');
  
  for (const notification of notifications) {
    try {
      // Vérifier si la notification existe déjà dans Sanity
      const existingNotification = await sanityClient.fetch(
        `*[_type == "notification" && _id == $id][0]`,
        { id: `notification-${notification.id}` }
      );
      
      const notificationData: any = {
        user: {
          _type: 'reference',
          _ref: `user-${notification.userId}`
        },
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead === 1
      };
      
      // Ajouter les références aux entités liées si disponibles
      if (notification.relatedVehicleId) {
        notificationData.relatedVehicle = {
          _type: 'reference',
          _ref: `vehicle-${notification.relatedVehicleId}`
        };
      }
      
      if (notification.relatedRequestId) {
        notificationData.relatedRequest = {
          _type: 'reference',
          _ref: `request-${notification.relatedRequestId}`
        };
      }
      
      if (notification.relatedMessageId) {
        notificationData.relatedMessage = {
          _type: 'reference',
          _ref: `message-${notification.relatedMessageId}`
        };
      }
      
      if (existingNotification) {
        console.log(`La notification ${notification.id} existe déjà dans Sanity, mise à jour...`);
        
        await sanityClient.patch(existingNotification._id)
          .set(notificationData)
          .commit();
      } else {
        console.log(`Création de la notification ${notification.id} dans Sanity...`);
        
        await sanityClient.create({
          _id: `notification-${notification.id}`,
          _type: 'notification',
          ...notificationData,
          _createdAt: notification.createdAt.toISOString()
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la migration de la notification ${notification.id}:`, error);
    }
  }
  
  console.log(`${notifications.length} notifications migrées.`);
}

// Exécuter le script
migrateToSanity(); 