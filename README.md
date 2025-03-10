# Remisage v2 - Application de Gestion des Véhicules de Service

Remisage est une application web moderne permettant de gérer l'assignation des véhicules de service aux employés, avec un suivi précis de leur localisation et un système de communication intégré.

## Fonctionnalités principales

### Gestion des utilisateurs
- **Authentification sécurisée** : Système de connexion avec JWT
- **Profil utilisateur** : Consultation et modification des informations personnelles
- **Gestion des mots de passe** : Possibilité de mettre à jour son mot de passe
- **Rôles distincts** : Administrateur et Employé avec des permissions différentes

### Gestion des véhicules
- **Tableau de bord** : Vue d'ensemble des véhicules disponibles et assignés
- **Assignation de véhicules** : Attribution et retrait de véhicules aux employés
- **Suivi de localisation** : Enregistrement et historique des adresses de remisage
- **Gestion complète** : Ajout, modification et suppression de véhicules (admin)

### Géolocalisation
- **Carte interactive** : Visualisation des véhicules sur une carte
- **Mise à jour de localisation** : Modification de l'adresse de remisage avec coordonnées
- **Historique des localisations** : Suivi des changements d'adresse avec horodatage

### Communication
- **Messagerie interne** : Échange de messages entre employés et administrateurs
- **Système de demandes** : Formulaires pour les requêtes spécifiques
- **Notifications** : Alertes pour les changements importants

## Architecture technique

### Frontend (client)
- **Framework** : React avec TypeScript
- **UI/UX** : Material-UI pour une interface moderne et responsive
- **État global** : Gestion du contexte avec React Context API
- **Routing** : React Router pour la navigation entre les pages
- **Requêtes API** : Axios pour la communication avec le backend

### Backend (server)
- **Runtime** : Node.js
- **Framework** : Fastify pour des performances optimales
- **Authentification** : JWT (JSON Web Tokens)
- **Base de données** : MySQL
- **API** : RESTful avec documentation Swagger

## Structure du projet

### Client
```
client/
├── public/            # Ressources statiques
├── src/
│   ├── components/    # Composants réutilisables
│   ├── context/       # Contextes React (Auth, Notifications)
│   ├── pages/         # Pages principales de l'application
│   ├── services/      # Services API (véhicules, utilisateurs, messages)
│   └── utils/         # Utilitaires (logger, helpers)
```

### Serveur
```
server/
├── src/
│   ├── config/        # Configuration (base de données, serveur)
│   ├── controllers/   # Contrôleurs (logique métier)
│   ├── models/        # Modèles de données
│   ├── plugins/       # Plugins Fastify
│   ├── routes/        # Définition des routes API
│   └── utils/         # Utilitaires (auth, helpers)
```

## Installation et démarrage

### Prérequis
- Node.js (v14+)
- MySQL (v8+)
- npm ou yarn

### Installation
1. Cloner le dépôt
   ```bash
   git clone https://github.com/nogoezen/Remisage-v2.git
   cd Remisage-v2
   ```

2. Installer les dépendances
   ```bash
   # Client
   cd client
   npm install

   # Serveur
   cd ../server
   npm install
   ```

3. Configurer la base de données
   - Créer une base de données MySQL
   - Configurer les variables d'environnement dans `.env`

4. Démarrer l'application
   ```bash
   # Serveur (dans le dossier server)
   npm run dev

   # Client (dans le dossier client)
   npm start
   ```

5. Accéder à l'application : `http://localhost:3000`

## Fonctionnalités détaillées

### Tableau de bord
- Vue personnalisée selon le rôle (admin/employé)
- Accès rapide aux véhicules assignés
- Statistiques et notifications

### Gestion des véhicules
- Création de nouveaux véhicules (modèle, plaque d'immatriculation, statut)
- Modification des informations des véhicules
- Assignation/désassignation aux employés
- Suivi de l'historique des localisations

### Profil utilisateur
- Consultation des informations personnelles
- Modification des données (nom, prénom, email)
- Changement de mot de passe sécurisé
- Affichage du rôle et des permissions

## Sécurité
- Authentification par token JWT
- Hachage sécurisé des mots de passe
- Validation des données côté client et serveur
- Protection des routes selon les rôles

## Comptes par défaut

### Administrateur
- Email: admin@remisage.com
- Mot de passe: admin123

### Employé
- Email: employee@remisage.com
- Mot de passe: employee123

## Développement

### Technologies principales
- React 17+
- TypeScript 4+
- Material-UI 5+
- Node.js 14+
- Fastify 3+
- MySQL 8+

### Bonnes pratiques
- Code TypeScript fortement typé
- Architecture modulaire et extensible
- Gestion d'état centralisée
- Logging détaillé pour le débogage

## Contribution
Les contributions sont les bienvenues ! N'hésitez pas à soumettre des pull requests ou à signaler des problèmes via les issues GitHub.

## Licence
Ce projet est sous licence MIT.

## Contact

Pour toute question ou suggestion, veuillez contacter [ninokirisan@gmail.com](mailto:ninokirisan@gmail.com). 