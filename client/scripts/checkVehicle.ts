/**
 * Script pour vérifier si un véhicule spécifique existe dans Sanity
 * 
 * Usage: npx ts-node scripts/checkVehicle.ts "Peugeot 205"
 */

// Importer le client Sanity
import { sanityClient } from '../src/config/sanity';

// Récupérer le modèle de véhicule à vérifier depuis les arguments ou utiliser une valeur par défaut
const vehicleModel = process.argv[2] || 'Peugeot 205';

async function checkVehicle() {
  try {
    console.log(`Recherche des véhicules avec le modèle: ${vehicleModel}`);
    
    // Requête GROQ pour trouver les véhicules par modèle
    const vehicles = await sanityClient.fetch(
      `*[_type == "vehicle" && model == $model] {
        _id,
        _createdAt,
        _updatedAt,
        model,
        licensePlate,
        status,
        address,
        location,
        assignedTo
      }`,
      { model: vehicleModel }
    );
    
    console.log(`Trouvé ${vehicles.length} véhicule(s) avec le modèle ${vehicleModel}`);
    
    if (vehicles.length === 0) {
      console.log(`Aucun véhicule avec le modèle ${vehicleModel} n'a été trouvé dans Sanity.`);
      return;
    }
    
    // Afficher les détails de chaque véhicule trouvé
    vehicles.forEach((vehicle: any, index: number) => {
      console.log(`\nVéhicule #${index + 1}:`);
      console.log('ID:', vehicle._id);
      console.log('Modèle:', vehicle.model);
      console.log('Plaque d\'immatriculation:', vehicle.licensePlate);
      console.log('Statut:', vehicle.status);
      console.log('Adresse:', vehicle.address || 'Non définie');
      console.log('Coordonnées:', vehicle.location ? `${vehicle.location.lat}, ${vehicle.location.lng}` : 'Non définies');
      console.log('Assigné à:', vehicle.assignedTo ? vehicle.assignedTo._ref : 'Non assigné');
      console.log('Créé le:', new Date(vehicle._createdAt).toLocaleString());
      console.log('Mis à jour le:', new Date(vehicle._updatedAt).toLocaleString());
      
      // Extraire l'ID numérique pour le client
      const numericId = vehicle._id.split('-')[1];
      console.log('ID numérique (pour le client):', numericId);
    });
    
    console.log('\nVérification terminée');
  } catch (error) {
    console.error('Erreur lors de la vérification du véhicule:', error);
  }
}

// Exécuter la fonction
checkVehicle(); 