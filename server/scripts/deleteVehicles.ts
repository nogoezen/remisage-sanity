/**
 * Script pour supprimer des véhicules spécifiques directement dans Sanity
 * 
 * Usage: npx ts-node scripts/deleteVehicles.ts
 */

// Importer le client Sanity
import { sanityClient } from '../src/config/sanity';

// Liste des modèles de véhicules à supprimer
const vehiclesToDelete = ['Peugeot 205', 'Renault 4', 'Renault 5'];

async function deleteVehicles() {
  try {
    console.log('Recherche des véhicules à supprimer...');
    
    // Rechercher les véhicules par modèle
    for (const model of vehiclesToDelete) {
      console.log(`Recherche des véhicules avec le modèle: ${model}`);
      
      // Requête GROQ pour trouver les véhicules par modèle
      const vehicles = await sanityClient.fetch(
        `*[_type == "vehicle" && model == $model]`,
        { model }
      );
      
      console.log(`Trouvé ${vehicles.length} véhicule(s) avec le modèle ${model}`);
      
      // Supprimer chaque véhicule trouvé
      for (const vehicle of vehicles) {
        console.log(`Suppression du véhicule: ${vehicle.model} (ID: ${vehicle._id})`);
        
        try {
          // Supprimer le véhicule
          await sanityClient.delete(vehicle._id);
          console.log(`Véhicule ${vehicle.model} (ID: ${vehicle._id}) supprimé avec succès`);
        } catch (error) {
          console.error(`Erreur lors de la suppression du véhicule ${vehicle.model} (ID: ${vehicle._id}):`, error);
        }
      }
    }
    
    console.log('Opération terminée');
  } catch (error) {
    console.error('Erreur lors de la suppression des véhicules:', error);
  }
}

// Exécuter la fonction
deleteVehicles(); 