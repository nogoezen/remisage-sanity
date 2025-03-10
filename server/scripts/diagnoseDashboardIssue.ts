/**
 * Script pour diagnostiquer pourquoi les véhicules ne s'affichent pas dans le dashboard
 * 
 * Usage: npx ts-node scripts/diagnoseDashboardIssue.ts
 */

// Importer le client Sanity et les modèles
import { sanityClient, extractId } from '../src/config/sanity';
import { VehicleModel } from '../src/models/VehicleSanity';

async function diagnoseDashboardIssue() {
  try {
    console.log('Diagnostic des problèmes d\'affichage des véhicules dans le dashboard...');
    console.log('----------------------------------------------------------------------');
    
    // 1. Vérifier si des véhicules existent dans Sanity
    console.log('\n1. Vérification des véhicules dans Sanity:');
    const sanityVehicles = await sanityClient.fetch(
      `*[_type == "vehicle"] {
        _id,
        model,
        licensePlate,
        status
      }`
    );
    
    console.log(`   - Trouvé ${sanityVehicles.length} véhicule(s) dans Sanity`);
    
    if (sanityVehicles.length === 0) {
      console.log('   ❌ Aucun véhicule trouvé dans Sanity. Veuillez en créer un d\'abord.');
      return;
    } else {
      console.log('   ✅ Des véhicules existent dans Sanity');
    }
    
    // 2. Vérifier si le modèle VehicleModel fonctionne correctement
    console.log('\n2. Vérification du modèle VehicleModel:');
    try {
      const allVehicles = await VehicleModel.findAll();
      console.log(`   - Le modèle a trouvé ${allVehicles.length} véhicule(s)`);
      
      if (allVehicles.length !== sanityVehicles.length) {
        console.log(`   ⚠️ Différence entre le nombre de véhicules dans Sanity (${sanityVehicles.length}) et le modèle (${allVehicles.length})`);
      } else {
        console.log('   ✅ Le modèle VehicleModel fonctionne correctement');
      }
    } catch (error) {
      console.error('   ❌ Erreur lors de l\'utilisation du modèle VehicleModel:', error);
    }
    
    // 3. Vérifier les IDs des véhicules
    console.log('\n3. Vérification des IDs des véhicules:');
    sanityVehicles.forEach((vehicle: any) => {
      const sanityId = vehicle._id;
      const numericId = extractId(sanityId);
      
      console.log(`   - Véhicule: ${vehicle.model} (${vehicle.licensePlate})`);
      console.log(`     ID Sanity: ${sanityId}`);
      console.log(`     ID Numérique: ${numericId}`);
      
      // Vérifier si l'ID numérique est valide
      const isValidNumericId = !isNaN(Number(numericId)) && Number(numericId) > 0;
      if (!isValidNumericId) {
        console.log(`     ❌ L'ID numérique ${numericId} n'est pas valide pour le client`);
      } else {
        console.log(`     ✅ L'ID numérique ${numericId} est valide`);
      }
    });
    
    // 4. Recommandations
    console.log('\n4. Recommandations:');
    console.log('   1. Vérifiez que le client utilise correctement l\'API pour récupérer les véhicules');
    console.log('   2. Assurez-vous que la fonction normalizeVehicle dans vehicleService.ts gère correctement les IDs Sanity');
    console.log('   3. Vérifiez les logs côté client pour voir s\'il y a des erreurs lors de la récupération des véhicules');
    console.log('   4. Essayez de créer un nouveau véhicule avec l\'interface utilisateur pour voir s\'il s\'affiche');
    
    console.log('\nDiagnostic terminé');
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
  }
}

// Exécuter la fonction
diagnoseDashboardIssue(); 