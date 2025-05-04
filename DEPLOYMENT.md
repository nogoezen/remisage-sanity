# Guide de déploiement sur Vercel

Ce guide vous explique comment déployer l'application Remisage sur Vercel.

## Prérequis

1. Un compte [Vercel](https://vercel.com)
2. Un compte [GitHub](https://github.com), [GitLab](https://gitlab.com) ou [Bitbucket](https://bitbucket.org)
3. Votre projet Remisage versionné avec Git et disponible sur l'une des plateformes ci-dessus

## Étape 1 : Préparation du projet

Votre projet est déjà préparé pour le déploiement sur Vercel avec les fichiers suivants :

- `server/vercel.json` : Configuration du déploiement du backend
- `server/src/index.vercel.ts` : Point d'entrée du backend adapté pour Vercel
- `server/src/index.routes.ts` : Routes simplifiées pour le déploiement
- `server/tsconfig.vercel.json` : Configuration TypeScript pour Vercel
- `client/vercel.json` : Configuration du déploiement du frontend

## Étape 2 : Déploiement du backend (server)

1. Connectez-vous à [Vercel](https://vercel.com)
2. Cliquez sur "Add New" > "Project"
3. Importez votre dépôt Git
4. Configurez le projet :
   - **Framework Preset** : Other
   - **Root Directory** : `server`
   - Les autres paramètres sont définis dans le fichier `vercel.json`
5. Configurez les variables d'environnement :
   ```
   JWT_SECRET=votre_secret_jwt
   SANITY_PROJECT_ID=votre_project_id
   SANITY_DATASET=production
   SANITY_TOKEN=votre_token
   CLIENT_URL=https://votre-frontend.vercel.app (à mettre à jour après le déploiement du frontend)
   ```
6. Cliquez sur "Deploy"
7. Notez l'URL de déploiement (par exemple, `https://remisage-server.vercel.app`)

### Résolution des problèmes de déploiement du backend

Si vous rencontrez des erreurs lors du déploiement du backend, vérifiez les points suivants :

1. **Erreur "Cannot find module '@fastify/autoload'"** :
   - Vérifiez que toutes les dépendances sont correctement listées dans `package.json`
   - Le fichier `index.vercel.ts` a été simplifié pour ne pas utiliser `autoload`
   - Assurez-vous que le déploiement utilise bien le fichier `index.vercel.ts` et non `index.ts`

2. **Erreurs TypeScript** :
   - Nous avons configuré `tsconfig.vercel.json` pour être moins strict lors du déploiement
   - Le fichier `index.routes.ts` fournit des routes simplifiées qui évitent les erreurs TypeScript
   - Si vous rencontrez encore des erreurs, vous pouvez désactiver complètement la vérification TypeScript en ajoutant `"noEmitOnError": true` dans `tsconfig.vercel.json`

3. **Erreur de connexion à Sanity** :
   - Vérifiez que les variables d'environnement Sanity sont correctement configurées
   - Assurez-vous que le token Sanity a les permissions nécessaires

## Étape 3 : Déploiement du frontend (client)

1. Retournez à la page d'accueil de Vercel
2. Cliquez sur "Add New" > "Project"
3. Importez le même dépôt Git
4. Configurez le projet :
   - **Framework Preset** : Create React App
   - **Root Directory** : `client`
   - Les autres paramètres sont définis dans le fichier `vercel.json`
5. Mettez à jour la variable d'environnement dans "Environment Variables" :
   ```
   REACT_APP_API_URL=https://votre-backend.vercel.app/api
   ```
   Remplacez `votre-backend.vercel.app` par l'URL de votre backend déployé à l'étape 2
6. Cliquez sur "Deploy"
7. Notez l'URL de déploiement (par exemple, `https://remisage-client.vercel.app`)

## Étape 4 : Mise à jour de la configuration CORS

1. Retournez aux paramètres de votre projet backend sur Vercel
2. Mettez à jour la variable d'environnement `CLIENT_URL` avec l'URL de votre frontend déployé
3. Redéployez le backend en cliquant sur "Redeploy" dans l'onglet "Deployments"

## Étape 5 : Vérification du déploiement

1. Accédez à l'URL de votre frontend déployé
2. Connectez-vous avec les identifiants par défaut :
   - Admin : admin@remisage.com / admin123
   - Employé : employee@remisage.com / employee123
3. Vérifiez que toutes les fonctionnalités fonctionnent correctement

## Dépannage

### Problèmes de CORS

Si vous rencontrez des erreurs CORS, vérifiez que :
- La variable `CLIENT_URL` dans le backend est correctement configurée
- Le fichier `server/src/index.vercel.ts` inclut l'URL de votre frontend dans la configuration CORS

### Erreurs 404 sur le frontend

Si vous obtenez des erreurs 404 lors de la navigation, vérifiez que :
- Le fichier `client/vercel.json` est correctement configuré avec les règles de réécriture
- Vous utilisez React Router en mode "Browser Router"

### Problèmes d'API

Si les appels API échouent, vérifiez que :
- La variable `REACT_APP_API_URL` dans le frontend pointe vers la bonne URL du backend
- Les variables d'environnement Sanity sont correctement configurées dans le backend
- Testez l'API en accédant directement à `https://votre-backend.vercel.app/api/health`

### Erreurs 500 sur le backend

Si vous obtenez des erreurs 500 sur le backend, vérifiez que :
- Les routes simplifiées dans `index.routes.ts` sont correctement configurées
- Les variables d'environnement sont correctement définies
- Les logs de déploiement sur Vercel pour identifier l'erreur spécifique

## Domaine personnalisé

Pour configurer un domaine personnalisé :
1. Allez dans les paramètres de votre projet sur Vercel
2. Cliquez sur "Domains"
3. Ajoutez votre domaine et suivez les instructions pour configurer les enregistrements DNS 