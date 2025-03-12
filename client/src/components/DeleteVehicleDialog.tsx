import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { Vehicle } from '../services/vehicleService';

interface DeleteVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<boolean>;
  vehicle: Vehicle | null;
}

const DeleteVehicleDialog: React.FC<DeleteVehicleDialogProps> = ({
  open,
  onClose,
  onConfirm,
  vehicle
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!vehicle) {
      console.error('Vehicle is null or undefined in handleConfirm');
      setError('Véhicule non disponible. Veuillez réessayer.');
      return;
    }
    
    // Log détaillé du véhicule pour le débogage
    console.log('Vehicle object in handleConfirm:', JSON.stringify(vehicle, null, 2));
    
    if (vehicle.id === undefined || vehicle.id === null) {
      console.error('Vehicle ID is null or undefined:', vehicle);
      setError('ID du véhicule non valide. Veuillez réessayer.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Convertir l'ID en nombre pour s'assurer qu'il est du bon type
      const numericId = Number(vehicle.id);
      console.log('Using numeric vehicle ID for deletion:', numericId);
      
      if (isNaN(numericId) || numericId <= 0) {
        console.error(`Invalid numeric ID: ${numericId} from vehicle ID: ${vehicle.id}`);
        setError('ID du véhicule non valide. Veuillez réessayer.');
        setLoading(false);
        return;
      }
      
      const result = await onConfirm(numericId);
      
      if (result) {
        setSuccess(true);
        
        // Fermer le dialogue après 2 secondes
        setTimeout(() => {
          onClose();
          // Réinitialiser l'état de succès après la fermeture
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      aria-labelledby="delete-vehicle-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-vehicle-dialog-title">
        <Box display="flex" alignItems="center">
          <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
          <Typography variant="h6">
            Supprimer le véhicule
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Véhicule supprimé avec succès!
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="body1" color="warning.main" fontWeight="bold">
                Attention: Cette action est irréversible!
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir supprimer définitivement ce véhicule ?
            </Typography>
            
            {vehicle && (
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {vehicle.model}
                </Typography>
                <Typography variant="body2">
                  Immatriculation: {vehicle.licensePlate}
                </Typography>
                {vehicle.address && (
                  <Typography variant="body2">
                    Adresse: {vehicle.address}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={loading || success}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained" 
          disabled={loading || success || !vehicle}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
        >
          {loading ? 'Suppression...' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteVehicleDialog; 