/**
 * Script pour tester la création d'un véhicule avec le nouveau format d'ID
 * 
 * Usage: npx ts-node scripts/createTestVehicle.ts
 */

// Importer le modèle VehicleModel
import { VehicleModel } from '../src/models/VehicleSanity';

async function createTestVehicle() {
  try {
    console.log('Création d\'un véhicule de test...');
    
    // Générer une plaque d'immatriculation unique
    const timestamp = Date.now();
    const licensePlate = `TEST-${timestamp.toString().slice(-6)}`;
    
    // Créer le véhicule
    const vehicle = await VehicleModel.create({
      model: 'Véhicule de Test',
      licensePlate,
      status: 'available',
      address: 'Adresse de test',
      latitude: 48.8566,
      longitude: 2.3522
    });
    
    console.log('\nVéhicule créé avec succès:');
    console.log('ID:', vehicle.id);
    console.log('ID Sanity:', `vehicle-${vehicle.id}`);
    console.log('Modèle:', vehicle.model);
    console.log('Plaque d\'immatriculation:', vehicle.licensePlate);
    console.log('Statut:', vehicle.status);
    console.log('Adresse:', vehicle.address);
    console.log('Coordonnées:', `${vehicle.latitude}, ${vehicle.longitude}`);
    console.log('Créé le:', vehicle.createdAt.toLocaleString());
    
    console.log('\nTest terminé');
  } catch (error) {
    console.error('Erreur lors de la création du véhicule de test:', error);
  }
}

// Exécuter la fonction
createTestVehicle(); 