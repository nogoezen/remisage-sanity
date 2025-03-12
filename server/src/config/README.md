# Configuration de l'API Remisage avec Sanity.io

Ce dossier contient les fichiers de configuration pour l'API Remisage, qui utilise désormais Sanity.io comme base de données.

## Sanity.io

[Sanity.io](https://www.sanity.io/) est une plateforme de gestion de contenu headless qui offre une grande flexibilité pour la modélisation des données et une API puissante pour les requêtes.

### Configuration

La configuration de Sanity se trouve dans le fichier `sanity.ts`. Ce fichier initialise le client Sanity avec les paramètres suivants :

- **Project ID** : Identifiant unique de votre projet Sanity
- **Dataset** : Ensemble de données à utiliser (généralement "production")
- **API Version** : Version de l'API Sanity à utiliser
- **Token** : Token d'authentification pour accéder à l'API Sanity

Ces paramètres sont définis dans le fichier `.env` à la racine du projet.

### Schémas

Les schémas de données sont définis dans le dossier `sanity-studio/schemaTypes/` et comprennent :

- **User** : Utilisateurs de l'application
- **Vehicle** : Véhicules de service
- **VehicleLocationHistory** : Historique des localisations des véhicules
- **Message** : Messages entre utilisateurs
- **Request** : Demandes des utilisateurs
- **Notification** : Notifications pour les utilisateurs

## Migration depuis MySQL

Cette application utilisait auparavant MySQL comme base de données. La migration vers Sanity.io a été effectuée pour bénéficier des avantages suivants :

- **Flexibilité du schéma** : Facilité de modification du schéma sans migrations complexes
- **API puissante** : Requêtes GROQ pour des opérations complexes
- **Interface d'administration** : Sanity Studio pour gérer les données
- **Hébergement cloud** : Pas besoin de gérer un serveur de base de données

### Étapes de migration

1. **Création des schémas Sanity** : Définition des types de documents dans Sanity Studio
2. **Création des modèles** : Implémentation des modèles utilisant l'API Sanity
3. **Adaptation des contrôleurs** : Mise à jour des contrôleurs pour utiliser les nouveaux modèles
4. **Migration des données** : Transfert des données de MySQL vers Sanity
5. **Tests** : Vérification du bon fonctionnement de l'application

## Utilisation

Pour utiliser Sanity dans l'application, importez le client Sanity depuis le fichier de configuration :

```typescript
import { sanityClient } from '../config/sanity';

// Exemple de requête
const users = await sanityClient.fetch('*[_type == "user"]');
```

Pour plus d'informations sur les requêtes GROQ, consultez la [documentation officielle](https://www.sanity.io/docs/groq).