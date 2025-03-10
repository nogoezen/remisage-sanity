/**
 * Script de déploiement optimisé pour Sanity Studio
 * 
 * Ce script effectue les opérations suivantes :
 * 1. Vérifie que toutes les dépendances sont installées
 * 2. Construit une version optimisée de Sanity Studio
 * 3. Déploie Sanity Studio sur l'infrastructure Sanity
 * 4. Déploie le schéma GraphQL (optionnel)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOY_GRAPHQL = true; // Mettre à false si vous n'utilisez pas GraphQL

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Fonction pour exécuter une commande avec logs
function runCommand(command, description) {
  console.log(`${colors.fg.cyan}${colors.bright}${description}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.fg.green}✓ ${description} terminé avec succès${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.fg.red}✗ Erreur lors de ${description.toLowerCase()}${colors.reset}`);
    console.error(`${colors.fg.red}${error.message}${colors.reset}\n`);
    return false;
  }
}

// Fonction principale
async function deploy() {
  console.log(`\n${colors.fg.magenta}${colors.bright}=== DÉPLOIEMENT DE SANITY STUDIO ===${colors.reset}\n`);
  
  // Vérifier que le package.json existe
  if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
    console.error(`${colors.fg.red}Erreur: package.json non trouvé. Assurez-vous d'exécuter ce script depuis le répertoire racine de Sanity Studio.${colors.reset}`);
    process.exit(1);
  }
  
  // Vérifier que les dépendances sont installées
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    if (!runCommand('npm install', 'Installation des dépendances')) {
      process.exit(1);
    }
  }
  
  // Construire Sanity Studio
  if (!runCommand('npm run build', 'Construction de Sanity Studio')) {
    process.exit(1);
  }
  
  // Déployer Sanity Studio
  if (!runCommand('npm run deploy', 'Déploiement de Sanity Studio')) {
    process.exit(1);
  }
  
  // Déployer le schéma GraphQL si nécessaire
  if (DEPLOY_GRAPHQL) {
    if (!runCommand('npm run deploy-graphql', 'Déploiement du schéma GraphQL')) {
      console.log(`${colors.fg.yellow}⚠️ Le déploiement du schéma GraphQL a échoué, mais Sanity Studio a été déployé avec succès.${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.fg.green}${colors.bright}✓ Déploiement terminé avec succès !${colors.reset}`);
  console.log(`${colors.fg.cyan}Vous pouvez maintenant accéder à votre studio Sanity déployé.${colors.reset}\n`);
}

// Exécuter la fonction principale
deploy().catch(error => {
  console.error(`${colors.fg.red}Une erreur inattendue s'est produite :${colors.reset}`);
  console.error(error);
  process.exit(1);
}); 