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

const EmployeeVehicleMap: React.FC = () => {
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
        // S'assurer que data est un tableau
        const vehicles = Array.isArray(data) ? data : [];
        const assignedVehicle = vehicles.find(v => v.assignedTo === user.id);
        
        if (assignedVehicle) {
          setVehicle(assignedVehicle);
          
          // Récupérer le nombre de changements de localisation effectués ce mois-ci
          // Dans une implémentation réelle, nous utiliserions un endpoint spécifique
          const historyData = await vehicleService.getLocationHistory(assignedVehicle.id);
          // S'assurer que historyData est un tableau
          const history = Array.isArray(historyData) ? historyData : [];
          
          // Filtrer pour ne garder que les changements du mois en cours
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const thisMonthChanges = history.filter(h => {
            const date = new Date(h.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });
          
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
    setLocationChangeOpen(true);
  };

  // Gestion de la fermeture du dialogue de changement de localisation
  const handleLocationChangeClose = () => {
    setLocationChangeOpen(false);
  };

  // Gestion de la mise à jour de la localisation
  const handleLocationUpdate = async (vehicleId: number, address: string, latitude: number, longitude: number): Promise<boolean> => {
    if (!vehicle) return false;
    
    try {
      await vehicleService.updateLocation(vehicleId, address, latitude, longitude);
      
      // Mettre à jour le véhicule avec les nouvelles coordonnées
      setVehicle({
        ...vehicle,
        address,
        latitude,
        longitude
      });
      
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
    } finally {
      setLocationChangeOpen(false);
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
          center={{ lat: vehicle.latitude || 48.8566, lng: vehicle.longitude || 2.3522 }}
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

export default EmployeeVehicleMap; 