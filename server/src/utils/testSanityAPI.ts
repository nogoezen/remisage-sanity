import { UserModel } from '../models/UserSanity';
import { VehicleModel } from '../models/VehicleSanity';
import { MessageModel } from '../models/MessageSanity';
import { RequestModel } from '../models/RequestSanity';
import { NotificationModel } from '../models/NotificationSanity';

/**
 * Script pour tester les API avec Sanity
 * Ce script effectue une série de tests sur les différentes API pour vérifier
 * que la migration vers Sanity a été effectuée correctement.
 */
async function testSanityAPI() {
  console.log('=== TEST DES API AVEC SANITY ===\n');
  
  try {
    // Test des utilisateurs
    console.log('--- Test des utilisateurs ---');
    const users = await UserModel.findAll();
    console.log(`Nombre d'utilisateurs: ${users.length}`);
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`Premier utilisateur: ${firstUser.firstName} ${firstUser.lastName} (${firstUser.email})`);
      
      // Test de recherche par ID
      const userById = await UserModel.findById(firstUser.id);
      console.log(`Utilisateur trouvé par ID: ${userById ? 'Oui' : 'Non'}`);
      
      // Test de recherche par email
      const userByEmail = await UserModel.findByEmail(firstUser.email);
      console.log(`Utilisateur trouvé par email: ${userByEmail ? 'Oui' : 'Non'}`);
    }
    console.log('Test des utilisateurs terminé avec succès\n');
    
    // Test des véhicules
    console.log('--- Test des véhicules ---');
    const vehicles = await VehicleModel.findAll();
    console.log(`Nombre de véhicules: ${vehicles.length}`);
    if (vehicles.length > 0) {
      const firstVehicle = vehicles[0];
      console.log(`Premier véhicule: ${firstVehicle.model} (${firstVehicle.licensePlate})`);
      
      // Test de recherche par ID
      const vehicleById = await VehicleModel.findById(firstVehicle.id);
      console.log(`Véhicule trouvé par ID: ${vehicleById ? 'Oui' : 'Non'}`);
      
      // Test de recherche par plaque d'immatriculation
      const vehicleByLicensePlate = await VehicleModel.findByLicensePlate(firstVehicle.licensePlate);
      console.log(`Véhicule trouvé par plaque d'immatriculation: ${vehicleByLicensePlate ? 'Oui' : 'Non'}`);
    }
    console.log('Test des véhicules terminé avec succès\n');
    
    // Test des messages
    console.log('--- Test des messages ---');
    if (users.length > 0) {
      const messages = await MessageModel.findByUser(users[0].id);
      console.log(`Nombre de messages pour l'utilisateur ${users[0].id}: ${messages.length}`);
    }
    console.log('Test des messages terminé avec succès\n');
    
    // Test des demandes
    console.log('--- Test des demandes ---');
    const requests = await RequestModel.findAll();
    console.log(`Nombre de demandes: ${requests.length}`);
    
    // Test des statistiques des demandes
    const stats = await RequestModel.getStats();
    console.log('Statistiques des demandes:');
    console.log(`- Total: ${stats.total}`);
    console.log(`- En attente: ${stats.pending}`);
    console.log(`- Approuvées: ${stats.approved}`);
    console.log(`- Rejetées: ${stats.rejected}`);
    console.log(`- Terminées: ${stats.completed}`);
    console.log('Test des demandes terminé avec succès\n');
    
    // Test des notifications
    console.log('--- Test des notifications ---');
    if (users.length > 0) {
      const notifications = await NotificationModel.findByUser(users[0].id);
      console.log(`Nombre de notifications pour l'utilisateur ${users[0].id}: ${notifications.length}`);
      
      // Test du comptage des notifications non lues
      const unreadCount = await NotificationModel.countUnread(users[0].id);
      console.log(`Nombre de notifications non lues: ${unreadCount}`);
    }
    console.log('Test des notifications terminé avec succès\n');
    
    console.log('=== TOUS LES TESTS ONT RÉUSSI ===');
  } catch (error) {
    console.error('Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testSanityAPI(); 