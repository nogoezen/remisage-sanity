/**
 * Script pour lister tous les véhicules dans Sanity
 * 
 * Usage: npx ts-node scripts/listAllVehicles.ts
 */

// Importer le client Sanity
import { sanityClient } from '../src/config/sanity';

async function listAllVehicles() {
  try {
    console.log('Récupération de tous les véhicules dans Sanity...');
    
    // Requête GROQ pour récupérer tous les véhicules
    const vehicles = await sanityClient.fetch(
      `*[_type == "vehicle"] | order(model asc) {
        _id,
        _createdAt,
        _updatedAt,
        model,
        licensePlate,
        status,
        address,
        location,
        assignedTo
      }`
    );
    
    console.log(`Trouvé ${vehicles.length} véhicule(s) au total`);
    
    if (vehicles.length === 0) {
      console.log('Aucun véhicule n\'a été trouvé dans Sanity.');
      return;
    }
    
    // Afficher un tableau récapitulatif
    console.log('\nRécapitulatif des véhicules:');
    console.log('-----------------------------------------------------------------------------------');
    console.log('| ID                   | Modèle        | Plaque       | Statut      | ID Numérique |');
    console.log('-----------------------------------------------------------------------------------');
    
    vehicles.forEach((vehicle: any) => {
      const numericId = vehicle._id.split('-')[1];
      const model = vehicle.model.padEnd(13, ' ').substring(0, 13);
      const licensePlate = (vehicle.licensePlate || 'N/A').padEnd(12, ' ').substring(0, 12);
      const status = (vehicle.status || 'N/A').padEnd(11, ' ').substring(0, 11);
      
      console.log(`| ${vehicle._id.padEnd(20, ' ')} | ${model} | ${licensePlate} | ${status} | ${numericId.padEnd(11, ' ')} |`);
    });
    
    console.log('-----------------------------------------------------------------------------------');
    
    // Demander à l'utilisateur s'il souhaite voir les détails complets
    console.log('\nPour voir les détails complets d\'un véhicule, utilisez:');
    console.log('npx ts-node scripts/checkVehicle.ts "Nom du modèle"');
    
    console.log('\nListe terminée');
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error);
  }
}

// Exécuter la fonction
listAllVehicles(); 