# Scripts de gestion des véhicules dans Sanity

Ce dossier contient plusieurs scripts pour gérer les véhicules dans la base de données Sanity.

## Prérequis

Avant d'exécuter ces scripts, assurez-vous que :

1. Node.js est installé sur votre machine
2. Vous êtes dans le répertoire `server` du projet
3. Toutes les dépendances sont installées (`npm install`)
4. Les variables d'environnement sont correctement configurées (`.env`)
5. TypeScript et ts-node sont installés (`npm install -g typescript ts-node`)

## Scripts de création et de test

### 1. Créer un véhicule de test

Ce script crée un véhicule de test avec le nouveau format d'ID.

```bash
npx ts-node scripts/createTestVehicle.ts
```

## Scripts de diagnostic

### 1. Vérifier si un véhicule existe dans Sanity

Ce script vérifie si un véhicule spécifique existe dans Sanity et affiche ses détails.

```bash
npx ts-node scripts/checkVehicle.ts "Peugeot 205"
```

### 2. Lister tous les véhicules dans Sanity

Ce script liste tous les véhicules présents dans Sanity.

```bash
npx ts-node scripts/listAllVehicles.ts
```

### 3. Diagnostiquer les problèmes d'affichage dans le dashboard

Ce script effectue un diagnostic complet pour déterminer pourquoi les véhicules ne s'affichent pas dans le dashboard.

```bash
npx ts-node scripts/diagnoseDashboardIssue.ts
```

### 4. Corriger l'ID d'un véhicule dans Sanity

Ce script corrige l'ID d'un véhicule pour qu'il soit au format attendu par le client (`vehicle-X`).

```bash
npx ts-node scripts/fixVehicleId.ts "Peugeot 205"
```

## Scripts de suppression

### 1. Supprimer des véhicules spécifiques (TypeScript)

Ce script supprime les véhicules Peugeot 205, Renault 4 et Renault 5 de la base de données Sanity.

```bash
npx ts-node scripts/deleteVehicles.ts
```

### 2. Supprimer des véhicules spécifiques (JavaScript)

Si vous préférez utiliser JavaScript, vous pouvez compiler le script TypeScript en JavaScript :

```bash
npx tsc scripts/deleteVehicles.ts --outDir scripts/dist
node scripts/dist/deleteVehicles.js
```

### 3. Supprimer des véhicules spécifiques (avec le modèle VehicleModel)

Ce script utilise le modèle VehicleModel pour supprimer les véhicules Peugeot 205, Renault 4 et Renault 5.

```bash
node scripts/deleteVehiclesWithModel.js
```

### 4. Supprimer des véhicules par modèle (avec arguments)

Ce script vous permet de spécifier les modèles de véhicules à supprimer en tant qu'arguments de ligne de commande.

```bash
node scripts/deleteVehiclesByModel.js "Peugeot 205" "Renault 4" "Renault 5"
```

### 5. Supprimer tous les véhicules

⚠️ **ATTENTION** : Ce script supprime TOUS les véhicules de la base de données Sanity. Utilisez-le avec précaution.

```bash
node scripts/deleteAllVehicles.js
```

## Exemples d'utilisation

### Créer un véhicule de test

```bash
npx ts-node scripts/createTestVehicle.ts
```

### Vérifier un véhicule spécifique

```bash
npx ts-node scripts/checkVehicle.ts "Peugeot 205"
```

### Corriger l'ID d'un véhicule

```bash
npx ts-node scripts/fixVehicleId.ts "Peugeot 205"
```

### Supprimer un seul modèle de véhicule

```bash
node scripts/deleteVehiclesByModel.js "Peugeot 205"
```

### Supprimer plusieurs modèles de véhicules

```bash
node scripts/deleteVehiclesByModel.js "Peugeot 205" "Renault 4" "Renault 5"
```

## Résolution des problèmes

Si vous rencontrez des erreurs lors de l'exécution des scripts, vérifiez les points suivants :

1. Assurez-vous que les variables d'environnement pour Sanity sont correctement configurées dans le fichier `.env`
2. Vérifiez que vous avez les droits d'accès nécessaires pour modifier la base de données Sanity
3. Assurez-vous que le client Sanity est correctement configuré dans `src/config/sanity.ts`
4. Si vous utilisez TypeScript, assurez-vous que ts-node est installé (`npm install -g ts-node`)

## Remarques

- Ces scripts sont destinés à être utilisés dans un environnement de développement ou de test
- Faites toujours une sauvegarde de vos données avant d'exécuter des scripts de suppression
- Les suppressions sont irréversibles, soyez prudent lors de l'utilisation de ces scripts 