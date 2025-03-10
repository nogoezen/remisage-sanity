# Remisage API Server

API backend pour l'application Remisage, utilisant Fastify et Sanity.io.

## Optimisations implémentées

### 1. Architecture modulaire
- **Routes modulaires** : Les routes sont organisées par domaine fonctionnel et centralisées dans un fichier d'index.
- **Contrôleurs spécialisés** : Chaque entité a son propre contrôleur avec des responsabilités bien définies.
- **Modèles Sanity** : Les modèles encapsulent la logique d'accès aux données Sanity.

### 2. Performance
- **Système de cache** : Mise en cache des requêtes Sanity fréquentes pour réduire les appels API.
- **Compression** : Compression gzip/deflate des réponses pour réduire la taille des données transmises.
- **Configuration optimisée** : Configuration TypeScript et Node.js optimisée pour la production.

### 3. Sécurité et robustesse
- **Validation des données** : Validation robuste des entrées utilisateur.
- **Gestion centralisée des erreurs** : Traitement uniforme des erreurs avec des messages appropriés.
- **Authentification JWT** : Sécurisation des routes avec JSON Web Tokens.

### 4. Maintenance et développement
- **Documentation Swagger** : API documentée avec Swagger UI.
- **Scripts utilitaires** : Scripts pour tester, migrer et vérifier l'application.
- **Environnements configurables** : Support pour les environnements de développement et de production.

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos propres valeurs
```

## Développement

```bash
# Lancer le serveur en mode développement
npm run dev

# Tester la connexion à Sanity
npm run test-sanity

# Tester les API Sanity
npm run test-sanity-api
```

## Production

```bash
# Compiler le projet
npm run build

# Lancer le serveur en mode production
npm run prod
```

## Structure du projet

```
server/
├── src/
│   ├── config/         # Configuration (Sanity, etc.)
│   ├── controllers/    # Contrôleurs pour chaque entité
│   ├── models/         # Modèles de données et interfaces
│   ├── plugins/        # Plugins Fastify (auth, validation)
│   ├── routes/         # Définition des routes API
│   ├── utils/          # Utilitaires (cache, gestion d'erreurs)
│   └── index.ts        # Point d'entrée de l'application
├── .env                # Variables d'environnement
├── package.json        # Dépendances et scripts
└── tsconfig.json       # Configuration TypeScript
```

## API Documentation

Une fois le serveur lancé, la documentation Swagger est disponible à l'adresse :
```
http://localhost:5000/documentation
``` 