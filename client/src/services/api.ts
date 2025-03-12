import axios from 'axios';
import logger from '../utils/logger';

// URL de base de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('API', `Requête avec token: ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      logger.debug('API', `Requête sans token: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    logger.error('API', 'Erreur lors de la préparation de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    logger.debug('API', `Réponse reçue: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error('API', `Erreur ${error.response.status}: ${error.response.config.url}`, error.response.data);
      
      // Rediriger vers la page de connexion si le token est expiré ou invalide
      if (error.response.status === 401) {
        logger.warn('API', 'Token expiré ou invalide, redirection vers la page de connexion');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      logger.error('API', 'Pas de réponse reçue du serveur', error.request);
    } else {
      logger.error('API', 'Erreur lors de la configuration de la requête', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 