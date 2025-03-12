import dotenv from 'dotenv';
import { sanityClient } from '../config/sanity';
import { VehicleModel } from '../models/VehicleSanity';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script pour corriger le problème des assignations de véhicules en double
 * 
 * Ce script:
 * 1. Identifie les véhicules qui ont des versions en double (brouillon et publié)
 * 2. Supprime les versions brouillon pour ne garder que les versions publiées
 * 3. Vérifie que l'assignation et la désassignation fonctionnent correctement
 */

// Fonction pour identifier les véhicules en double
async function findDuplicateVehicles(): Promise<Array<{id: string, versions: any[]}>> {
  console.log('Recherche des véhicules en double...');
  
  // Récupérer tous les véhicules, y compris les brouillons
  const allVehicles = await sanityClient.fetch(`
    *[_type == "vehicle"] {
      _id,
      _type,
      model,
      licensePlate,
      status,
      assignedTo
    }
  `);
  
  console.log(`Nombre total de documents véhicules trouvés: ${allVehicles.length}`);
  
  // Identifier les véhicules en double
  const vehicleMap = new Map<string, any[]>();
  const duplicates: Array<{id: string, versions: any[]}> = [];
  
  allVehicles.forEach((vehicle: any) => {
    const id = vehicle._id.replace('drafts.', '').replace('vehicle-', '');
    
    if (!vehicleMap.has(id)) {
      vehicleMap.set(id, []);
    }
    
    vehicleMap.get(id)!.push(vehicle);
  });
  
  // Trouver les véhicules qui ont plus d'une version
  vehicleMap.forEach((versions, id) => {
    if (versions.length > 1) {
      duplicates.push({
        id,
        versions
      });
    }
  });
  
  console.log(`Nombre de véhicules en double: ${duplicates.length}`);
  
  return duplicates;
}

// Fonction pour supprimer les versions brouillon des véhicules
async function deleteDraftVersions(duplicates: Array<{id: string, versions: any[]}>): Promise<void> {
  console.log('Suppression des versions brouillon...');
  
  for (const duplicate of duplicates) {
    const draftVersions = duplicate.versions.filter((v: any) => v._id.startsWith('drafts.'));
    
    for (const draftVersion of draftVersions) {
      console.log(`Suppression du brouillon: ${draftVersion._id}`);
      try {
        await sanityClient.delete(draftVersion._id);
        console.log(`Brouillon supprimé avec succès: ${draftVersion._id}`);
      } catch (error) {
        console.error(`Erreur lors de la suppression du brouillon ${draftVersion._id}:`, error);
      }
    }
  }
  
  console.log('Suppression des versions brouillon terminée.');
}

// Fonction pour tester l'assignation et la désassignation
async function testAssignmentProcess() {
  console.log('\nTest du processus d\'assignation et de désassignation...');
  
  // Récupérer un véhicule disponible
  const vehicles = await VehicleModel.findAll();
  const availableVehicle = vehicles.find(v => v.status === 'available');
  
  if (!availableVehicle) {
    console.error('Aucun véhicule disponible trouvé. Impossible de continuer le test.');
    return;
  }
  
  // Récupérer un utilisateur avec le rôle "employee"
  const users = await sanityClient.fetch(`
    *[_type == "user" && role == "employee" && has_vehicle_assigned == true][0] {
      _id,
      firstName,
      lastName
    }
  `);
  
  if (!users) {
    console.error('Aucun employé éligible trouvé. Impossible de continuer le test.');
    return;
  }
  
  const userId = users._id.replace('user-', '');
  const vehicleId = availableVehicle.id.toString();
  
  console.log(`Véhicule sélectionné: ${availableVehicle.model} (${availableVehicle.licensePlate}), ID: ${vehicleId}`);
  console.log(`Utilisateur sélectionné: ${users.firstName} ${users.lastName}, ID: ${userId}`);
  
  // 1. Assigner le véhicule à l'utilisateur
  console.log(`\nAssignation du véhicule ${vehicleId} à l'utilisateur ${userId}...`);
  const assignResult = await VehicleModel.assignToUser(vehicleId, userId);
  console.log(`Résultat de l'assignation: ${assignResult ? 'Succès' : 'Échec'}`);
  
  // Vérifier que le véhicule est bien assigné
  const assignedVehicle = await VehicleModel.findById(vehicleId);
  console.log('Véhicule après assignation:');
  console.log(JSON.stringify(assignedVehicle, null, 2));
  
  // Vérifier qu'il n'y a pas de version brouillon
  const draftCheck = await sanityClient.fetch(`
    *[_id == $draftId][0]
  `, { draftId: `drafts.vehicle-${vehicleId}` });
  
  if (draftCheck) {
    console.error('Une version brouillon a été créée lors de l\'assignation!');
    console.log('Version brouillon:');
    console.log(JSON.stringify(draftCheck, null, 2));
  } else {
    console.log('Aucune version brouillon créée lors de l\'assignation. C\'est bon!');
  }
  
  // 2. Désassigner le véhicule
  console.log(`\nDésassignation du véhicule ${vehicleId}...`);
  const unassignResult = await VehicleModel.assignToUser(vehicleId, null);
  console.log(`Résultat de la désassignation: ${unassignResult ? 'Succès' : 'Échec'}`);
  
  // Vérifier que le véhicule est bien désassigné
  const unassignedVehicle = await VehicleModel.findById(vehicleId);
  console.log('Véhicule après désassignation:');
  console.log(JSON.stringify(unassignedVehicle, null, 2));
  
  // Vérifier qu'il n'y a pas de version brouillon
  const draftCheckAfterUnassign = await sanityClient.fetch(`
    *[_id == $draftId][0]
  `, { draftId: `drafts.vehicle-${vehicleId}` });
  
  if (draftCheckAfterUnassign) {
    console.error('Une version brouillon a été créée lors de la désassignation!');
    console.log('Version brouillon:');
    console.log(JSON.stringify(draftCheckAfterUnassign, null, 2));
  } else {
    console.log('Aucune version brouillon créée lors de la désassignation. C\'est bon!');
  }
}

// Fonction pour corriger la méthode assignToUser
async function fixAssignToUserMethod() {
  console.log('\nCorrection de la méthode assignToUser...');
  
  console.log(`
Pour corriger le problème des versions brouillon, modifiez la méthode assignToUser dans VehicleSanity.ts:

static async assignToUser(vehicleId: string, userId: string | null): Promise<boolean> {
  try {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) {
      return false;
    }

    const updateData: any = {
      status: userId ? 'assigned' : 'available'
    };

    if (userId) {
      updateData.assignedTo = {
        _type: 'reference',
        _ref: \`user-\${userId}\`
      };
    } else {
      updateData.assignedTo = null;
    }

    // Utiliser la transaction pour publier immédiatement les modifications
    const transaction = sanityClient.transaction();
    
    transaction.patch(\`vehicle-\${vehicleId}\`, patch => patch.set(updateData));
    transaction.commit({ autoGenerateArrayKeys: true });
    
    return true;
  } catch (error) {
    console.error('Error assigning vehicle to user:', error);
    return false;
  }
}
  `);
}

// Fonction principale
async function main() {
  console.log('=== Script de correction des assignations de véhicules ===');
  
  try {
    // 1. Trouver les véhicules en double
    const duplicates = await findDuplicateVehicles();
    
    // 2. Supprimer les versions brouillon
    if (duplicates.length > 0) {
      await deleteDraftVersions(duplicates);
    }
    
    // 3. Tester le processus d'assignation et de désassignation
    await testAssignmentProcess();
    
    // 4. Proposer une correction pour la méthode assignToUser
    await fixAssignToUserMethod();
    
    console.log('\n=== Script terminé ===');
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

// Exécuter le script
main()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  }); 