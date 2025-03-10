/**
 * Ce script explique comment générer un token Sanity pour l'API
 * 
 * Pour générer un token Sanity, suivez ces étapes :
 * 
 * 1. Connectez-vous à votre compte Sanity sur https://www.sanity.io/manage
 * 2. Sélectionnez votre projet (remisage)
 * 3. Allez dans "API" dans le menu de gauche
 * 4. Cliquez sur l'onglet "Tokens"
 * 5. Cliquez sur "Add API token"
 * 6. Donnez un nom à votre token (ex: "Migration Token")
 * 7. Sélectionnez les permissions nécessaires (au minimum "Editor" pour la migration)
 * 8. Cliquez sur "Create token"
 * 9. Copiez le token généré
 * 10. Ajoutez-le à votre fichier .env :
 *     votre-token-ici
 * 
 * Note : Ne partagez jamais votre token Sanity, il donne accès à votre projet.
 */

console.log(`
Pour générer un token Sanity, suivez ces étapes :

1. Connectez-vous à votre compte Sanity sur https://www.sanity.io/manage
2. Sélectionnez votre projet (remisage)
3. Allez dans "API" dans le menu de gauche
4. Cliquez sur l'onglet "Tokens"
5. Cliquez sur "Add API token"
6. Donnez un nom à votre token (ex: "Migration Token")
7. Sélectionnez les permissions nécessaires (au minimum "Editor" pour la migration)
8. Cliquez sur "Create token"
9. Copiez le token généré
10. Ajoutez-le à votre fichier .env :
    SANITY_TOKEN=votre-token-ici

Note : Ne partagez jamais votre token Sanity, il donne accès à votre projet.
`); 