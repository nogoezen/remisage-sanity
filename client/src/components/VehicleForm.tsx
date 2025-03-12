import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Vehicle } from '../services/vehicleService';

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  vehicle?: Vehicle | null;
  title: string;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  open,
  onClose,
  onSubmit,
  vehicle = null,
  title
}) => {
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [status, setStatus] = useState<'available' | 'assigned' | 'maintenance'>('available');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le formulaire avec les données du véhicule si disponibles
  useEffect(() => {
    if (vehicle) {
      console.log('Initialisation du formulaire avec les données du véhicule:', vehicle);
      setModel(vehicle.model || '');
      setLicensePlate(vehicle.licensePlate || '');
      setStatus(vehicle.status || 'available');
      setAddress(vehicle.address || '');
      setLatitude(vehicle.latitude !== undefined ? vehicle.latitude : '');
      setLongitude(vehicle.longitude !== undefined ? vehicle.longitude : '');
    } else {
      // Réinitialiser le formulaire
      console.log('Réinitialisation du formulaire');
      setModel('');
      setLicensePlate('');
      setStatus('available');
      setAddress('');
      setLatitude('');
      setLongitude('');
    }
    
    setSuccess(false);
    setError(null);
  }, [vehicle, open]);

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as 'available' | 'assigned' | 'maintenance');
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setModel('');
    setLicensePlate('');
    setStatus('available');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!model.trim()) {
      setError('Le modèle est requis');
      return;
    }
    
    if (!licensePlate.trim()) {
      setError('La plaque d\'immatriculation est requise');
      return;
    }
    
    // Validation supplémentaire pour la plaque d'immatriculation (format français)
    const licensePlateRegex = /^[A-Z0-9-]{2,10}$/;
    if (!licensePlateRegex.test(licensePlate.trim())) {
      setError('Format de plaque d\'immatriculation invalide. Utilisez des lettres majuscules, des chiffres et des tirets.');
      return;
    }
    
    // Validation des coordonnées si elles sont fournies
    if (latitude !== '' && (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
      setError('La latitude doit être un nombre entre -90 et 90');
      return;
    }
    
    if (longitude !== '' && (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
      setError('La longitude doit être un nombre entre -180 et 180');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Préparer les données du véhicule
      const vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> = {
        model: model.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        status,
        // Utiliser undefined au lieu de null pour les champs optionnels
        address: address.trim() || undefined,
        latitude: latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== '' ? Number(longitude) : undefined
      };
      
      console.log('Envoi des données du véhicule:', JSON.stringify(vehicleData, null, 2));
      
      const result = await onSubmit(vehicleData);
      console.log('Résultat de la soumission:', result);
      
      if (result) {
        setSuccess(true);
        
        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          if (vehicle === null) { // Si c'est un nouveau véhicule
            resetForm();
          }
          
          // Fermer le dialogue
          onClose();
          
          // Réinitialiser l'état de succès après la fermeture
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Erreur lors de la soumission du formulaire:', err);
      setError(err.response?.data?.error || 'Une erreur est survenue lors de l\'enregistrement du véhicule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      aria-labelledby="vehicle-form-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="vehicle-form-dialog-title">
        <Box display="flex" alignItems="center">
          <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {vehicle ? 'Véhicule modifié avec succès!' : 'Véhicule créé avec succès!'}
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {vehicle 
              ? 'Modifiez les informations du véhicule ci-dessous.' 
              : 'Remplissez le formulaire pour créer un nouveau véhicule.'}
          </Typography>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="model"
          label="Modèle"
          type="text"
          fullWidth
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading || success}
          required
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 100 }}
          helperText={`${model.length}/100 caractères`}
        />
        
        <TextField
          margin="dense"
          id="licensePlate"
          label="Plaque d'immatriculation"
          type="text"
          fullWidth
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
          disabled={loading || success}
          required
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 20 }}
          helperText="Format: AB-123-CD (lettres majuscules, chiffres et tirets)"
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="status-label">Statut</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={status}
            label="Statut"
            onChange={handleStatusChange}
            disabled={loading || success}
          >
            <MenuItem value="available">Disponible</MenuItem>
            <MenuItem value="assigned">Assigné</MenuItem>
            <MenuItem value="maintenance">En maintenance</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          margin="dense"
          id="address"
          label="Adresse (optionnel)"
          type="text"
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading || success}
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 255 }}
          helperText={`${address.length}/255 caractères`}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            margin="dense"
            id="latitude"
            label="Latitude (optionnel)"
            type="number"
            fullWidth
            value={latitude}
            onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading || success}
            inputProps={{ step: 'any', min: -90, max: 90 }}
            helperText="Entre -90 et 90"
          />
          
          <TextField
            margin="dense"
            id="longitude"
            label="Longitude (optionnel)"
            type="number"
            fullWidth
            value={longitude}
            onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading || success}
            inputProps={{ step: 'any', min: -180, max: 180 }}
            helperText="Entre -180 et 180"
          />
        </Box>
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
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleForm; 