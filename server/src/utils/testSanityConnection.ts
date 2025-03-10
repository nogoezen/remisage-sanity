import { sanityClient } from '../config/sanity';

/**
 * Script pour tester la connexion à Sanity
 */
async function testSanityConnection() {
  try {
    console.log('Test de connexion à Sanity...');
    
    // Tester la connexion en récupérant un document
    const result = await sanityClient.fetch('*[_type == "user"][0...2]');
    
    console.log('\nRésultat de la requête:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result && result.length > 0) {
      console.log('\nConnexion à Sanity réussie!');
    } else {
      console.log('\nConnexion à Sanity réussie, mais aucun document trouvé.');
      console.log('Cela peut être normal si vous n\'avez pas encore migré de données.');
    }
  } catch (error) {
    console.error('\nErreur lors de la connexion à Sanity:', error);
    console.log('\nVérifiez que:');
    console.log('1. Votre token Sanity est valide et a les permissions nécessaires');
    console.log('2. Votre Project ID et Dataset sont corrects');
    console.log('3. Votre connexion internet fonctionne');
  }
}

// Exécuter le test
testSanityConnection(); 