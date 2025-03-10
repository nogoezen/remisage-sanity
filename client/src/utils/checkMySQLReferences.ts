import * as fs from 'fs';
import * as path from 'path';

/**
 * Script pour vérifier les références à MySQL dans le projet
 * Ce script parcourt tous les fichiers du projet et recherche des références à MySQL
 * pour s'assurer que la migration vers Sanity a été complète.
 */

// Termes à rechercher
const searchTerms = [
  'mysql',
  'MySQL',
  'createPool',
  'createConnection',
  'connection.query',
  'pool.query',
  'database.ts',
  'schema.sql',
  'sample_data.sql',
  'reset_db.js',
  'load_sample_data.js',
  'initDb.ts'
];

// Répertoires à exclure
const excludeDirs = [
  'node_modules',
  'dist',
  '.git',
  'utils/migrateToSanity.ts' // Ce fichier peut contenir des références à MySQL pour la migration
];

// Compteurs
let filesChecked = 0;
let filesWithReferences = 0;
let totalReferences = 0;

/**
 * Vérifie si un fichier contient des références à MySQL
 * @param filePath Chemin du fichier à vérifier
 */
function checkFile(filePath: string): void {
  // Vérifier si le fichier doit être exclu
  if (excludeDirs.some(dir => filePath.includes(dir))) {
    return;
  }

  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    filesChecked++;

    // Rechercher les termes
    const references: { term: string, line: number }[] = [];
    
    // Parcourir chaque ligne du fichier
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      searchTerms.forEach(term => {
        if (line.includes(term)) {
          references.push({ term, line: index + 1 });
          totalReferences++;
        }
      });
    });

    // Afficher les résultats si des références ont été trouvées
    if (references.length > 0) {
      filesWithReferences++;
      console.log(`\nFichier: ${filePath}`);
      references.forEach(ref => {
        console.log(`  Ligne ${ref.line}: contient "${ref.term}"`);
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
  }
}

/**
 * Parcourt récursivement un répertoire et vérifie tous les fichiers
 * @param dirPath Chemin du répertoire à parcourir
 */
function walkDir(dirPath: string): void {
  // Vérifier si le répertoire doit être exclu
  if (excludeDirs.some(dir => dirPath.includes(dir))) {
    return;
  }

  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        walkDir(filePath);
      } else if (stats.isFile()) {
        // Vérifier uniquement les fichiers texte
        const ext = path.extname(filePath).toLowerCase();
        if (['.ts', '.js', '.json', '.md', '.env', '.sql'].includes(ext)) {
          checkFile(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`Erreur lors de la lecture du répertoire ${dirPath}:`, error);
  }
}

// Point d'entrée du script
console.log('=== VÉRIFICATION DES RÉFÉRENCES À MYSQL ===\n');
console.log('Recherche des termes suivants:', searchTerms.join(', '));
console.log('Répertoires exclus:', excludeDirs.join(', '));
console.log('\nDébut de la vérification...\n');

// Commencer la vérification à partir du répertoire src
const srcDir = path.join(__dirname, '..');
walkDir(srcDir);

// Afficher le résumé
console.log('\n=== RÉSUMÉ ===');
console.log(`Fichiers vérifiés: ${filesChecked}`);
console.log(`Fichiers avec références: ${filesWithReferences}`);
console.log(`Nombre total de références: ${totalReferences}`);

if (filesWithReferences === 0) {
  console.log('\n✅ Aucune référence à MySQL trouvée. La migration est complète!');
} else {
  console.log('\n⚠️ Des références à MySQL ont été trouvées. Veuillez les vérifier et les supprimer si nécessaire.');
} 