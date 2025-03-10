/**
 * Configuration pour Google Maps
 */
import { Libraries } from '@react-google-maps/api';

// Clé API Google Maps
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDoasO0PpeeYKVrWmVoll5cInbDMvcwM7I';

// Map ID pour les marqueurs avancés
// Vous devez créer un Map ID dans la console Google Cloud Platform
// https://developers.google.com/maps/documentation/javascript/cloud-based-map-styling
// Pour les tests, vous pouvez utiliser le Map ID de démonstration de Google
export const GOOGLE_MAPS_MAP_ID = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'bf51a910020fa25a';

// Options par défaut pour la carte
export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
};

// Centre par défaut (Paris)
export const DEFAULT_CENTER = {
  lat: 48.8566,
  lng: 2.3522
};

// Styles pour la carte
export const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px'
};

// Bibliothèques à charger
// Note: 'places' est nécessaire pour l'autocomplete
export const LIBRARIES: Libraries = ['places']; 