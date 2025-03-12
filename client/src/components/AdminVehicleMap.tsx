import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Divider,
  Button,
  Alert
} from '@mui/material';
import GoogleMapComponent from './GoogleMapComponent';
import vehicleService, { Vehicle } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';
import LocationChangeDialog from './LocationChangeDialog';

const AdminVehicleMap: React.FC = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationChangeOpen, setLocationChangeOpen] = useState<boolean>(false);
  const [locationChangeCount, setLocationChangeCount] = useState<number>(0);
  const [locationChangeLimit, setLocationChangeLimit] = useState<number>(2);
  const [locationChangeSuccess, setLocationChangeSuccess] = useState<boolean>(false);

  // Récupération du véhicule assigné à l'employé
  useEffect(() => {
    const fetchAssignedVehicle = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Dans une implémentation réelle, nous utiliserions un endpoint spécifique
        // pour récupérer le véhicule assigné à l'employé connecté
        const data = await vehicleService.getAll();
        console.log('Fetched vehicles:', data);
        
        // S'assurer que data est un tableau
        const vehicles = Array.isArray(data) ? data : [];
        const assignedVehicle = vehicles.find(v => v.assignedTo === user.id);
        
        console.log('Assigned vehicle:', assignedVehicle);
        
        if (assignedVehicle) {
          setVehicle(assignedVehicle);
          
          // Récupérer le nombre de changements de localisation effectués ce mois-ci
          // Dans une implémentation réelle, nous utiliserions un endpoint spécifique
          const historyData = await vehicleService.getLocationHistory(assignedVehicle.id);
          console.log('Location history:', historyData);
          
          // S'assurer que historyData est un tableau
          const history = Array.isArray(historyData) ? historyData : [];
          
          // Filtrer pour ne garder que les changements du mois en cours
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const thisMonthChanges = history.filter(h => {
            const date = new Date(h.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });
          
          console.log('This month changes:', thisMonthChanges.length);
          setLocationChangeCount(thisMonthChanges.length);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération du véhicule assigné:', err);
        setError('Impossible de récupérer votre véhicule assigné. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedVehicle();
  }, [user]);

  // Gestion de l'ouverture du dialogue de changement de localisation
  const handleLocationChangeOpen = () => {
    console.log('Opening location change dialog');
    setLocationChangeOpen(true);
  };

  // Gestion de la fermeture du dialogue de changement de localisation
  const handleLocationChangeClose = () => {
    console.log('Closing location change dialog');
    setLocationChangeOpen(false);
  };

  // Gestion de la mise à jour de la localisation
  const handleLocationUpdate = async (
    vehicleId: number, 
    address: string, 
    latitude: number, 
    longitude: number,
    previousAddress: string,
    previousLatitude: number,
    previousLongitude: number
  ): Promise<boolean> => {
    if (!vehicle) {
      console.error('Vehicle is null in handleLocationUpdate');
      return false;
    }
    
    // Log détaillé du véhicule pour le débogage
    console.log('Current vehicle object:', JSON.stringify(vehicle, null, 2));
    
    // Vérification plus robuste de l'ID du véhicule
    if (vehicleId === undefined || vehicleId === null || isNaN(Number(vehicleId))) {
      console.error('Vehicle ID is invalid in handleLocationUpdate:', vehicleId);
      // Utiliser l'ID du véhicule actuel si celui passé est invalide
      if (vehicle.id !== undefined && vehicle.id !== null) {
        console.log('Using current vehicle.id instead:', vehicle.id);
        vehicleId = vehicle.id;
      } else {
        console.error('Current vehicle has no valid ID:', vehicle);
        return false;
      }
    }
    
    // Convertir l'ID en nombre pour s'assurer qu'il est du bon type
    const numericVehicleId = Number(vehicleId);
    console.log('Using numeric vehicle ID:', numericVehicleId);
    
    console.log('Updating location:', { 
      vehicleId: numericVehicleId, 
      address, 
      latitude, 
      longitude,
      previousAddress,
      previousLatitude,
      previousLongitude
    });
    
    try {
      const updatedVehicle = await vehicleService.updateLocation(
        numericVehicleId, 
        address, 
        latitude, 
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      );
      console.log('Location updated successfully:', updatedVehicle);
      
      // Mettre à jour le véhicule avec les nouvelles coordonnées
      setVehicle(updatedVehicle);
      
      setLocationChangeCount(prev => prev + 1);
      setLocationChangeSuccess(true);
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setLocationChangeSuccess(false);
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la localisation:', err);
      setError('Impossible de mettre à jour la localisation. Veuillez réessayer plus tard.');
      return false;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!vehicle) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Aucun véhicule ne vous est assigné actuellement.</Typography>
      </Paper>
    );
  }

  // Convertir les coordonnées en nombres pour le centre de la carte
  const mapCenter = {
    lat: vehicle.latitude ? Number(vehicle.latitude) : 48.8566,
    lng: vehicle.longitude ? Number(vehicle.longitude) : 2.3522
  };

  console.log('Rendering map with center:', mapCenter);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mon véhicule
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {locationChangeSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          La localisation a été mise à jour avec succès.
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          <strong>Modèle:</strong> {vehicle.model}
        </Typography>
        <Typography variant="body1">
          <strong>Immatriculation:</strong> {vehicle.licensePlate}
        </Typography>
        <Typography variant="body1">
          <strong>Adresse actuelle:</strong> {vehicle.address || 'Non spécifiée'}
        </Typography>
        <Typography variant="body1">
          <strong>Changements de localisation ce mois-ci:</strong> {locationChangeCount} / {locationChangeLimit}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleLocationChangeOpen}
          disabled={locationChangeCount >= locationChangeLimit}
        >
          Modifier la localisation
        </Button>
        {locationChangeCount >= locationChangeLimit && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Vous avez atteint la limite de changements de localisation pour ce mois-ci.
          </Typography>
        )}
      </Box>
      
      <Box sx={{ height: '400px', width: '100%' }}>
        <GoogleMapComponent 
          vehicles={[vehicle]}
          center={mapCenter}
          height="400px"
          zoom={15}
        />
      </Box>
      
      {/* Dialogue de changement de localisation */}
      <LocationChangeDialog 
        open={locationChangeOpen}
        onClose={handleLocationChangeClose}
        onSubmit={handleLocationUpdate}
        vehicle={vehicle}
      />
    </Paper>
  );
};

export default AdminVehicleMap; 