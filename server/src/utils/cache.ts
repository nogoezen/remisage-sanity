/**
 * Utilitaire de cache pour les requêtes Sanity
 * Permet de mettre en cache les résultats des requêtes fréquentes pour améliorer les performances
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class SanityCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // Durée de vie par défaut en millisecondes

  constructor(defaultTTL = 60000) { // 1 minute par défaut
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Récupère une valeur du cache
   * @param key Clé de cache
   * @returns La valeur mise en cache ou undefined si elle n'existe pas ou a expiré
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Vérifier si l'élément existe et n'a pas expiré
    if (item && item.expiry > Date.now()) {
      return item.value as T;
    }
    
    // Supprimer l'élément expiré
    if (item) {
      this.cache.delete(key);
    }
    
    return undefined;
  }

  /**
   * Met une valeur en cache
   * @param key Clé de cache
   * @param value Valeur à mettre en cache
   * @param ttl Durée de vie en millisecondes (utilise la valeur par défaut si non spécifiée)
   */
  set<T>(key: string, value: T, ttl = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Supprime une valeur du cache
   * @param key Clé de cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Supprime tous les éléments expirés du cache
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Récupère une valeur du cache ou l'obtient via la fonction fournie
   * @param key Clé de cache
   * @param fetchFn Fonction pour obtenir la valeur si elle n'est pas en cache
   * @param ttl Durée de vie en millisecondes (utilise la valeur par défaut si non spécifiée)
   * @returns La valeur mise en cache ou obtenue via la fonction
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl = this.defaultTTL): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }
}

// Exporter une instance unique du cache
export const sanityCache = new SanityCache();

// Nettoyer le cache périodiquement (toutes les 5 minutes)
setInterval(() => {
  sanityCache.cleanExpired();
}, 300000); 