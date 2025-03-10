import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import path from 'path';
import { sanityCache } from '../utils/cache';

// Charger les variables d'environnement avec le chemin absolu
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env file from:', envPath);
config({ path: envPath });

// Récupérer les variables d'environnement ou utiliser des valeurs par défaut
const projectId = process.env.SANITY_PROJECT_ID || 'ka2bseil';
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_TOKEN || 'skhWOGeIt5DcTEyVI35v4xc4KlyySIML1bGyeCKDYRTSaUekcg478w0TTLjG39jjZTpbQthd4BWlZ2UXIz7jqwf1v2VKsNTJdZiZAz18nhBqfYcyXD3UoQei0wukuXbYfnMOVbgzKG0hOBa1RyYEVypX1IIxkMPjOQtPbc0jq9tZFCyDqohd';

// Afficher les valeurs utilisées pour le débogage
console.log('Configuration Sanity:');
console.log('- Project ID:', projectId);
console.log('- Dataset:', dataset);
console.log('- Token:', token ? 'Défini' : 'Non défini');

// Configuration du client Sanity
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03', // Utiliser la date du jour au format YYYY-MM-DD
  token,
  useCdn: process.env.NODE_ENV === 'production', // `false` si vous voulez des données fraîches
});

// Client Sanity avec cache
export const cachedFetch = async <T>(query: string, params?: any, ttl?: number): Promise<T> => {
  const cacheKey = `${query}:${JSON.stringify(params || {})}`;
  
  return sanityCache.getOrFetch<T>(
    cacheKey,
    async () => sanityClient.fetch<T>(query, params),
    ttl
  );
};

// Tester la connexion
sanityClient.fetch('*[_type == "user"][0]')
  .then(result => {
    console.log('Successfully connected to Sanity:', result ? 'Data found' : 'No data found');
  })
  .catch(err => {
    console.error('Error connecting to Sanity:', err);
  });

// Fonction utilitaire pour convertir les ID Sanity en ID simples
export const extractId = (sanityId: string): string => {
  if (!sanityId) {
    console.warn('extractId: sanityId is undefined or null');
    return '';
  }
  
  // Vérifier si l'ID est au format attendu (type-id)
  if (sanityId.includes('-')) {
    const parts = sanityId.split('-');
    if (parts.length >= 2) {
      return parts[1]; // Retourner la partie après le premier tiret
    }
  }
  
  // Si l'ID n'est pas au format attendu, le retourner tel quel
  console.warn(`extractId: unexpected ID format: ${sanityId}`);
  return sanityId;
};

// Fonction utilitaire pour convertir les dates Sanity en objets Date
export const parseDate = (sanityDate: string): Date => {
  return new Date(sanityDate);
}; 