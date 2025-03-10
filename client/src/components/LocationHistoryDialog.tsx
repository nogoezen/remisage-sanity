import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import vehicleService, { LocationHistory, Vehicle } from '../services/vehicleService';

interface LocationHistoryDialogProps {
  vehicleId: number;
  open: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LocationHistoryDialog: React.FC<LocationHistoryDialogProps> = ({
  vehicleId,
  open,
  onClose
}) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les informations du véhicule et l'historique de localisation lorsque le dialogue s'ouvre
  useEffect(() => {
    if (open && vehicleId > 0) {
      fetchVehicleAndHistory();
    }
  }, [open, vehicleId]);

  const fetchVehicleAndHistory = async () => {
    if (vehicleId <= 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les informations du véhicule
      const vehicleData = await vehicleService.getById(vehicleId);
      setVehicle(vehicleData);
      
      // Récupérer l'historique de localisation
      const historyData = await vehicleService.getLocationHistory(vehicleId);
      setLocationHistory(historyData);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(err.response?.data?.error || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="location-history-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="location-history-dialog-title">
        <Box display="flex" alignItems="center">
          <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Historique des adresses de remisage
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {vehicle && (
          <Typography variant="subtitle1" gutterBottom>
            Véhicule: {vehicle.model} ({vehicle.licensePlate})
          </Typography>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : locationHistory.length === 0 ? (
          <Paper elevation={1} sx={{ p: 3, my: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              Aucun historique de modification d'adresse disponible pour ce véhicule.
            </Typography>
          </Paper>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {locationHistory.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.address}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Date de modification: {formatDate(item.createdAt)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  {item.firstName && item.lastName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, minWidth: '200px' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Modifié par: {item.firstName} {item.lastName}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
                {index < locationHistory.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationHistoryDialog; 