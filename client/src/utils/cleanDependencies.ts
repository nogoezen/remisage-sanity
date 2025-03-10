import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Script pour nettoyer les dépendances inutilisées dans package.json
 * Ce script analyse les dépendances du projet et supprime celles qui ne sont plus utilisées
 * après la migration de MySQL vers Sanity.
 */

// Chemin vers le fichier package.json
const packageJsonPath = path.join(__dirname, '../../package.json');

// Lire le fichier package.json
let packageJson: any;
try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  packageJson = JSON.parse(packageJsonContent);
} catch (error) {
  console.error('Erreur lors de la lecture du fichier package.json:', error);
  process.exit(1);
}

// Liste des dépendances potentiellement inutilisées après la migration
const unusedDependencies = [
  'mysql2',
  'mysql',
  'sequelize',
  'typeorm',
  'knex',
  'pg',
  'sqlite3',
  'mongodb',
  'mongoose'
];

// Vérifier les dépendances
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};

const unusedFound: string[] = [];

// Vérifier dans les dépendances
Object.keys(dependencies).forEach(dep => {
  if (unusedDependencies.includes(dep)) {
    unusedFound.push(dep);
    delete dependencies[dep];
  }
});

// Vérifier dans les dépendances de développement
Object.keys(devDependencies).forEach(dep => {
  if (unusedDependencies.includes(dep)) {
    unusedFound.push(dep);
    delete devDependencies[dep];
  }
});

// Mettre à jour le fichier package.json si des dépendances inutilisées ont été trouvées
if (unusedFound.length > 0) {
  packageJson.dependencies = dependencies;
  packageJson.devDependencies = devDependencies;
  
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Les dépendances suivantes ont été supprimées:', unusedFound.join(', '));
    
    // Exécuter npm install pour mettre à jour package-lock.json
    console.log('\nMise à jour de package-lock.json...');
    execSync('npm install', { cwd: path.join(__dirname, '../..'), stdio: 'inherit' });
    
    console.log('\n✅ Nettoyage des dépendances terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier package.json:', error);
  }
} else {
  console.log('✅ Aucune dépendance inutilisée trouvée.');
} 