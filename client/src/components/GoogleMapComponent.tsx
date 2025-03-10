import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, Libraries } from '@react-google-maps/api';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { Vehicle } from '../services/vehicleService';
import { 
  GOOGLE_MAPS_API_KEY, 
  DEFAULT_MAP_OPTIONS, 
  DEFAULT_CENTER,
  MAP_CONTAINER_STYLE,
  LIBRARIES
} from '../config/maps';

interface GoogleMapComponentProps {
  vehicles: Vehicle[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string | number;
  width?: string | number;
  onMarkerClick?: (vehicle: Vehicle) => void;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  vehicles = [],
  center = DEFAULT_CENTER,
  zoom = 10,
  height = '400px',
  width = '100%',
  onMarkerClick
}) => {
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  // S'assurer que vehicles est un tableau
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  
  // État pour stocker les marqueurs
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  
  // Chargement de l'API Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script-main',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES as Libraries
  });

  // Référence à la carte
  const mapRef = React.useRef<google.maps.Map | null>(null);

  // Callback lorsque la carte est chargée
  const onLoad = React.useCallback((map: google.maps.Map) => {
    console.log('GoogleMapComponent: Map loaded');
    mapRef.current = map;
  }, []);

  // Callback lorsque la carte est déchargée
  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);
  
  // Créer les marqueurs lorsque la carte est chargée
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    // Supprimer les marqueurs existants
    markers.forEach(marker => {
      marker.setMap(null);
    });
    
    // Créer de nouveaux marqueurs
    const newMarkers = safeVehicles.map(vehicle => {
      // Vérifier si le véhicule a des coordonnées de latitude et longitude
      if (!vehicle.latitude || !vehicle.longitude) {
        console.warn('Vehicle missing coordinates:', vehicle);
        return null;
      }
      
      // Convertir les coordonnées en nombres
      const lat = Number(vehicle.latitude);
      const lng = Number(vehicle.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates for vehicle:', vehicle);
        return null;
      }
      
      console.log('Creating marker for vehicle:', vehicle.id, 'at position:', lat, lng);
      
      try {
        // Créer le marqueur standard
        const marker = new window.google.maps.Marker({
          map: mapRef.current,
          position: { lat, lng },
          title: `${vehicle.model} (${vehicle.licensePlate})`,
          icon: {
            url: vehicle.status === 'available' 
              ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' 
              : vehicle.status === 'assigned' 
                ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }
        });
        
        // Ajouter un écouteur d'événement pour le clic
        marker.addListener('click', () => {
          console.log('Marker clicked:', vehicle);
          setSelectedVehicle(vehicle);
          if (onMarkerClick) onMarkerClick(vehicle);
        });
        
        return marker;
      } catch (error) {
        console.error('Error creating marker for vehicle:', vehicle.id, error);
        return null;
      }
    }).filter(Boolean) as google.maps.Marker[];
    
    setMarkers(newMarkers);
    
    // Nettoyer les marqueurs lors du démontage
    return () => {
      newMarkers.forEach(marker => {
        if (marker) marker.setMap(null);
      });
    };
  }, [isLoaded, safeVehicles, mapRef.current, onMarkerClick]);

  // Gestion des erreurs de chargement
  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return (
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">
          Erreur lors du chargement de Google Maps. Veuillez réessayer plus tard.
        </Typography>
      </Paper>
    );
  }

  // Affichage d'un loader pendant le chargement
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height, width: width }}>
        <CircularProgress />
      </Box>
    );
  }

  // Adapter le style du conteneur de la carte
  const mapContainerStyle = {
    ...MAP_CONTAINER_STYLE,
    width,
    height
  };

  return (
    <Box sx={{ height, width }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={DEFAULT_MAP_OPTIONS}
      >
        {/* Les marqueurs sont gérés par useEffect */}
        
        {/* Affichage de l'info-bulle pour le véhicule sélectionné */}
        {selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude && (
          <InfoWindow
            position={{ 
              lat: Number(selectedVehicle.latitude), 
              lng: Number(selectedVehicle.longitude) 
            }}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <Box sx={{ p: 1, maxWidth: 200 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedVehicle.model}
              </Typography>
              <Typography variant="body2">
                Immatriculation: {selectedVehicle.licensePlate}
              </Typography>
              <Typography variant="body2">
                Statut: {selectedVehicle.status === 'available' ? 'Disponible' : 
                        selectedVehicle.status === 'assigned' ? 'Assigné' : 'En maintenance'}
              </Typography>
              <Typography variant="body2">
                Adresse: {selectedVehicle.address || 'Non spécifiée'}
              </Typography>
              {selectedVehicle.assignedTo && (
                <Typography variant="body2">
                  Assigné à: {selectedVehicle.firstName} {selectedVehicle.lastName}
                </Typography>
              )}
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
};

export default GoogleMapComponent;