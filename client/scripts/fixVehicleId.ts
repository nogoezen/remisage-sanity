/**
 * Script pour corriger l'ID d'un véhicule dans Sanity
 * 
 * Usage: npx ts-node scripts/fixVehicleId.ts "Peugeot 205"
 */

// Importer le client Sanity
import { sanityClient } from '../src/config/sanity';

// Récupérer le modèle de véhicule à corriger depuis les arguments ou utiliser une valeur par défaut
const vehicleModel = process.argv[2] || 'Peugeot 205';

async function fixVehicleId() {
  try {
    console.log(`Recherche du véhicule avec le modèle: ${vehicleModel}`);
    
    // Requête GROQ pour trouver le véhicule par modèle
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
    
    // Traiter chaque véhicule trouvé
    for (const vehicle of vehicles) {
      console.log(`\nVéhicule à corriger:`);
      console.log('ID actuel:', vehicle._id);
      console.log('Modèle:', vehicle.model);
      console.log('Plaque d\'immatriculation:', vehicle.licensePlate);
      
      // Vérifier si l'ID est déjà au bon format
      if (vehicle._id.startsWith('vehicle-')) {
        console.log('✅ L\'ID est déjà au bon format. Aucune correction nécessaire.');
        continue;
      }
      
      // Générer un nouvel ID au format vehicle-X
      // Utiliser un timestamp pour garantir l'unicité
      const timestamp = Date.now();
      const newId = `vehicle-${timestamp}`;
      
      console.log(`Nouvel ID proposé: ${newId}`);
      
      // Demander une confirmation avant de procéder
      console.log('\nATTENTION: Cette opération va créer un nouveau document et supprimer l\'ancien.');
      console.log('Cette action est irréversible.');
      console.log('Pour continuer, appuyez sur Ctrl+C pour annuler ou attendez 5 secondes pour continuer...');
      
      // Attendre 5 secondes avant de continuer
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Créer un nouveau document avec le nouvel ID
      console.log(`\nCréation d'un nouveau document avec l'ID: ${newId}`);
      
      // Préparer les données du véhicule
      const vehicleData = {
        _id: newId,
        _type: 'vehicle',
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        address: vehicle.address,
        location: vehicle.location,
        assignedTo: vehicle.assignedTo,
        _createdAt: vehicle._createdAt,
        _updatedAt: new Date().toISOString()
      };
      
      try {
        // Créer le nouveau document
        const result = await sanityClient.createOrReplace(vehicleData);
        console.log(`✅ Nouveau document créé avec succès: ${result._id}`);
        
        // Supprimer l'ancien document
        console.log(`Suppression de l'ancien document: ${vehicle._id}`);
        await sanityClient.delete(vehicle._id);
        console.log(`✅ Ancien document supprimé avec succès`);
        
        console.log(`\nVéhicule corrigé avec succès. Nouvel ID: ${newId}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la correction de l'ID:`, error);
      }
    }
    
    console.log('\nOpération terminée');
  } catch (error) {
    console.error('Erreur lors de la correction de l\'ID du véhicule:', error);
  }
}

// Exécuter la fonction
fixVehicleId(); 