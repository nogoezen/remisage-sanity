const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour exécuter une commande shell
function runCommand(command) {
  try {
    console.log(`Exécution de la commande: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Fonction pour copier un fichier
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`Fichier copié: ${source} -> ${destination}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la copie du fichier: ${source} -> ${destination}`);
    console.error(error.message);
    return false;
  }
}

// Fonction principale de build
async function build() {
  console.log('Démarrage du processus de build personnalisé pour Vercel...');

  // Créer le répertoire dist s'il n'existe pas
  ensureDirectoryExists('dist');
  ensureDirectoryExists('dist/src');
  ensureDirectoryExists('dist/src/routes');

  // Copier les fichiers nécessaires
  copyFile('src/index.vercel.ts', 'dist/src/index.vercel.js');
  copyFile('src/index.routes.ts', 'dist/src/index.routes.js');

  // Créer un fichier index.js vide dans le répertoire dist/src/routes
  fs.writeFileSync('dist/src/routes/index.js', '// Fichier généré automatiquement\n');

  console.log('Build personnalisé terminé avec succès!');
}

// Exécuter la fonction de build
build().catch(error => {
  console.error('Erreur lors du build:', error);
  process.exit(1);
}); 