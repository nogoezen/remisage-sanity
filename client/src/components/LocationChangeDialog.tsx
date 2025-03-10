import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Vehicle } from '../services/vehicleService';
import { GoogleMap, useJsApiLoader, Libraries } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  DEFAULT_MAP_OPTIONS,
  MAP_CONTAINER_STYLE,
  LIBRARIES
} from '../config/maps';
import { useAuth } from '../context/AuthContext';
import { createLocationChangeNotification } from '../utils/notificationUtils';

interface LocationChangeDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (vehicleId: number, address: string, latitude: number, longitude: number, previousAddress: string, previousLatitude: number, previousLongitude: number) => Promise<boolean>;
}

const LocationChangeDialog: React.FC<LocationChangeDialogProps> = ({
  vehicle,
  open,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Sauvegarder les valeurs initiales
  const [initialAddress, setInitialAddress] = useState<string>('');
  const [initialLatitude, setInitialLatitude] = useState<number>(0);
  const [initialLongitude, setInitialLongitude] = useState<number>(0);

  // Chargement de l'API Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script-location-dialog',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES as Libraries
  });

  // Convertir les coordonnées en nombres
  const initialLat = vehicle?.latitude ? Number(vehicle.latitude) : 48.8566;
  const initialLng = vehicle?.longitude ? Number(vehicle.longitude) : 2.3522;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  });

  // Références pour les composants Google Maps
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Réinitialiser les états lorsque le véhicule change ou que le dialogue s'ouvre
  useEffect(() => {
    if (vehicle && open) {
      // Vérifier que le véhicule a un ID valide
      if (!vehicle.id) {
        console.error('Vehicle without valid ID:', vehicle);
        setError('Ce véhicule n\'a pas d\'identifiant valide. Veuillez contacter l\'administrateur.');
        return;
      }

      // Sauvegarder les valeurs initiales
      const initialAddr = vehicle.address || '';
      const initialLat = vehicle.latitude ? Number(vehicle.latitude) : 48.8566;
      const initialLng = vehicle.longitude ? Number(vehicle.longitude) : 2.3522;

      setInitialAddress(initialAddr);
      setInitialLatitude(initialLat);
      setInitialLongitude(initialLng);

      // Initialiser les valeurs actuelles
      setAddress(initialAddr);
      setPosition({
        lat: initialLat,
        lng: initialLng
      });

      setError(null);
      setSuccess(false);

      console.log('Valeurs initiales sauvegardées:', {
        vehicleId: vehicle.id,
        address: initialAddr,
        latitude: initialLat,
        longitude: initialLng
      });
    }
  }, [vehicle, open]);

  // Initialiser l'autocomplete lorsque la carte est chargée
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !open) return;

    // Initialiser l'autocomplete avec des options améliorées
    const autocompleteOptions = {
      types: ['address'],
      componentRestrictions: { country: 'fr' },
      fields: ['address_components', 'formatted_address', 'geometry', 'name']
    };
    
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      autocompleteOptions
    );

    // Écouter les changements de sélection
    const placeChangedListener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        console.log('New coordinates from autocomplete:', lat, lng);
        console.log('Selected place:', place);

        setAddress(place.formatted_address || '');
        setPosition({
          lat: lat,
          lng: lng
        });

        // Centrer la carte sur la nouvelle position
        if (mapRef.current) {
          mapRef.current.panTo(place.geometry.location);
          mapRef.current.setZoom(15);
        }

        // Mettre à jour la position du marqueur
        if (markerRef.current) {
          markerRef.current.setPosition(place.geometry.location);
        }
      }
    });

    // Nettoyer l'écouteur lorsque le composant est démonté
    return () => {
      if (placeChangedListener) {
        window.google.maps.event.removeListener(placeChangedListener);
      }
    };
  }, [isLoaded, open]);

  // Créer ou mettre à jour le marqueur lorsque la carte est chargée
  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded');
    mapRef.current = map;

    // Créer un nouveau marqueur
    markerRef.current = new window.google.maps.Marker({
      map: map,
      position: position,
      title: vehicle?.model || 'Véhicule',
      draggable: true
    });

    // Ajouter un écouteur d'événement pour le glisser-déposer
    markerRef.current.addListener('dragend', () => {
      if (markerRef.current) {
        const newPos = markerRef.current.getPosition();
        if (newPos) {
          const lat = newPos.lat();
          const lng = newPos.lng();

          console.log('Marker dragged to:', lat, lng);

          setPosition({ lat, lng });

          // Géocodage inverse pour obtenir l'adresse à partir des coordonnées
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              console.log('Geocoder result:', results[0]);
              setAddress(results[0].formatted_address);
            } else {
              console.error('Geocoder failed due to:', status);
            }
          });
        }
      }
    });
  }, [position, vehicle]);

  // Mettre à jour la position du marqueur lorsque la position change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  // Gérer le changement d'adresse manuel
  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (error) {
      setError(null);
    }
  }, [error]);

  // Géocoder l'adresse lorsque l'utilisateur arrête de taper
  const handleAddressBlur = useCallback(() => {
    if (!isLoaded || !address || address.trim().length < 5) return;

    // Utiliser le service Geocoder pour obtenir les coordonnées à partir de l'adresse
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results[0] && results[0].geometry) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        console.log('Geocoded coordinates:', lat, lng);
        console.log('Geocoded address:', results[0].formatted_address);

        // Mettre à jour l'adresse formatée
        setAddress(results[0].formatted_address);
        
        // Mettre à jour la position
        setPosition({
          lat: lat,
          lng: lng
        });

        // Centrer la carte sur la nouvelle position
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(15);
        }

        // Mettre à jour la position du marqueur
        if (markerRef.current) {
          markerRef.current.setPosition(location);
        }
      }
    });
  }, [address, isLoaded]);

  const handleSubmit = async () => {
    if (!vehicle) {
      console.error('Vehicle is null or undefined');
      setError('Véhicule non disponible. Veuillez réessayer.');
      return;
    }

    // Log détaillé du véhicule pour le débogage
    console.log('Vehicle object in handleSubmit:', JSON.stringify(vehicle, null, 2));

    if (vehicle.id === undefined || vehicle.id === null) {
      console.error('Vehicle ID is null or undefined:', vehicle);
      setError('ID du véhicule non valide. Veuillez réessayer.');
      return;
    }

    // Validation
    if (!address || address.trim().length < 5) {
      setError('Veuillez entrer une adresse valide (minimum 5 caractères)');
      return;
    }

    try {
      setLoading(true);
      const vehicleId = vehicle.id;
      console.log('Submitting location update:', {
        vehicleId,
        address,
        lat: position.lat,
        lng: position.lng,
        previousAddress: initialAddress,
        previousLatitude: initialLatitude,
        previousLongitude: initialLongitude
      });

      const result = await onSubmit(
        vehicleId,
        address,
        position.lat,
        position.lng,
        initialAddress,
        initialLatitude,
        initialLongitude
      );

      setSuccess(result);
      setLoading(false);

      // Créer une notification pour le changement d'adresse
      if (result && vehicle.assignedTo) {
        await createLocationChangeNotification(
          vehicleId,
          vehicle.model,
          address,
          vehicle.assignedTo
        );
      }

      // Fermer le dialogue après 2 secondes
      setTimeout(() => {
        onClose();
        // Réinitialiser l'état de succès après la fermeture
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la modification de l\'adresse');
    }
  };

  // Adapter le style du conteneur de la carte
  const mapContainerStyle = {
    ...MAP_CONTAINER_STYLE,
    height: '300px'
  };

  // Affichage d'un loader pendant le chargement
  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="location-change-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="location-change-dialog-title">
          <Box display="flex" alignItems="center">
            <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Modifier l'adresse de remisage
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement de Google Maps. Veuillez réessayer plus tard.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      aria-labelledby="location-change-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="location-change-dialog-title">
        <Box display="flex" alignItems="center">
          <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Modifier l'adresse de remisage
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            L'adresse de remisage a été modifiée avec succès!
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <DialogContentText sx={{ mb: 3 }}>
            Veuillez entrer la nouvelle adresse de remisage pour votre véhicule {vehicle?.model} ({vehicle?.licensePlate}).
            Vous pouvez également déplacer le marqueur sur la carte pour sélectionner une position précise.
          </DialogContentText>
        )}

        <TextField
          inputRef={inputRef}
          autoFocus
          margin="dense"
          id="address"
          label="Adresse de remisage"
          type="text"
          fullWidth
          value={address}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          disabled={loading || success || !isLoaded}
          placeholder="Ex: 123 Rue de Paris, 75001 Paris"
          helperText="Commencez à taper pour voir les suggestions d'adresses"
          sx={{ mb: 2 }}
        />

        <Paper elevation={3} sx={{ mb: 2 }}>
          {!isLoaded ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, height: '300px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={position}
              zoom={15}
              options={DEFAULT_MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {/* Le marqueur est géré par useEffect */}
            </GoogleMap>
          )}
        </Paper>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary" sx={{ flex: 1 }}>
            Coordonnées: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          Vous pouvez déplacer le marqueur sur la carte pour sélectionner une position précise. L'adresse sera automatiquement mise à jour.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || success || !isLoaded}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationChangeDialog; 