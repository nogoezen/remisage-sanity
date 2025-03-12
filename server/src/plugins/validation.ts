import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errorHandler';

// Étendre l'interface FastifyRequest pour inclure la méthode validateData
declare module 'fastify' {
  interface FastifyRequest {
    validateData(schema: any): Record<string, any>;
  }
}

/**
 * Plugin de validation des données
 * Ajoute des méthodes de validation aux requêtes
 */
export default fp(async (fastify: FastifyInstance) => {
  // Ajouter un décorateur pour valider les données
  fastify.decorateRequest('validateData', function(this: FastifyRequest, schema: any) {
    const body = this.body as Record<string, any> || {};
    
    // Vérifier les champs requis
    if (schema.required) {
      for (const field of schema.required) {
        if (body[field] === undefined) {
          throw AppError.validation(`Le champ '${field}' est requis`, { field });
        }
      }
    }
    
    // Vérifier les types et formats
    if (schema.properties) {
      for (const [field, config] of Object.entries<any>(schema.properties)) {
        if (body[field] !== undefined) {
          // Validation du type
          if (config.type && typeof body[field] !== config.type) {
            throw AppError.validation(
              `Le champ '${field}' doit être de type ${config.type}`,
              { field, expected: config.type, received: typeof body[field] }
            );
          }
          
          // Validation des valeurs énumérées
          if (config.enum && !config.enum.includes(body[field])) {
            throw AppError.validation(
              `La valeur '${body[field]}' n'est pas valide pour le champ '${field}'`,
              { field, allowedValues: config.enum }
            );
          }
          
          // Validation des formats spéciaux (email, etc.)
          if (config.format === 'email' && !validateEmail(body[field])) {
            throw AppError.validation(
              `Le format de l'email '${body[field]}' n'est pas valide`,
              { field }
            );
          }
        }
      }
    }
    
    return body;
  });
});

/**
 * Valide un email avec une expression régulière simple
 * @param email Email à valider
 * @returns true si l'email est valide, false sinon
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 