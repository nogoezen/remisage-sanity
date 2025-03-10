import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Paper, 
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { CreateRequestData, RequestType } from '../services/requestService';
import { Vehicle } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';

interface RequestFormProps {
  vehicles: Vehicle[];
  onSubmit: (requestData: CreateRequestData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const RequestForm: React.FC<RequestFormProps> = ({ 
  vehicles, 
  onSubmit,
  isSubmitting = false
}) => {
  const { user } = useAuth();
  
  // État initial du formulaire
  const [formData, setFormData] = useState<CreateRequestData>({
    userId: user?.id || 0,
    type: 'maintenance',
    details: '',
  });
  
  // États des erreurs de validation
  const [errors, setErrors] = useState({
    type: '',
    details: '',
    vehicleId: ''
  });

  // Gestion des changements dans les champs texte
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser l'erreur lorsque l'utilisateur commence à taper
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gestion des changements dans le champ select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as RequestType,
        // Réinitialiser vehicleId si le type n'est pas lié à un véhicule
        vehicleId: value === 'schedule_change' || value === 'other' 
          ? undefined 
          : prev.vehicleId 
      }));
    } else if (name === 'vehicleId' && value) {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Réinitialiser l'erreur lorsque l'utilisateur change la sélection
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { type: '', details: '', vehicleId: '' };
    
    if (!formData.type) {
      newErrors.type = 'Le type de demande est requis';
      isValid = false;
    }
    
    if (!formData.details || formData.details.trim().length < 10) {
      newErrors.details = 'Veuillez fournir des détails (minimum 10 caractères)';
      isValid = false;
    }
    
    if ((formData.type === 'vehicle_change' || formData.type === 'location_change' || formData.type === 'maintenance') && !formData.vehicleId) {
      newErrors.vehicleId = 'Veuillez sélectionner un véhicule';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await onSubmit(formData);
        // Réinitialiser le formulaire après soumission réussie
        setFormData({
          userId: user?.id || 0,
          type: 'maintenance',
          details: '',
        });
      } catch (error) {
        console.error('Erreur lors de la soumission de la demande:', error);
        // Gérer les erreurs de soumission ici
      }
    }
  };

  // Label pour les types de demande
  const getTypeLabel = (type: RequestType): string => {
    switch(type) {
      case 'vehicle_change': return 'Changement de véhicule';
      case 'location_change': return 'Modification de l\'adresse de remisage';
      case 'schedule_change': return 'Modification d\'horaire';
      case 'maintenance': return 'Maintenance';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  // Vérifier si le type de demande nécessite un véhicule
  const requiresVehicle = (): boolean => {
    return ['vehicle_change', 'location_change', 'maintenance'].includes(formData.type);
  };

  // Vérifier si l'utilisateur a des véhicules assignés
  const hasAssignedVehicles = (): boolean => {
    return vehicles.length > 0;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Nouvelle demande
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FormControl 
          fullWidth 
          margin="normal" 
          error={!!errors.type}
        >
          <InputLabel id="type-label">Type de demande</InputLabel>
          <Select
            labelId="type-label"
            id="type"
            name="type"
            value={formData.type}
            label="Type de demande"
            onChange={handleSelectChange}
          >
            <MenuItem value="maintenance">{getTypeLabel('maintenance')}</MenuItem>
            <MenuItem value="location_change">{getTypeLabel('location_change')}</MenuItem>
            <MenuItem value="vehicle_change">{getTypeLabel('vehicle_change')}</MenuItem>
            <MenuItem value="schedule_change">{getTypeLabel('schedule_change')}</MenuItem>
            <MenuItem value="other">{getTypeLabel('other')}</MenuItem>
          </Select>
          {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
        </FormControl>
        
        {requiresVehicle() && (
          <FormControl 
            fullWidth 
            margin="normal" 
            error={!!errors.vehicleId}
          >
            <InputLabel id="vehicle-label">Véhicule concerné</InputLabel>
            <Select
              labelId="vehicle-label"
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId?.toString() || ''}
              label="Véhicule concerné"
              onChange={handleSelectChange}
            >
              {Array.isArray(vehicles) && vehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.model} ({vehicle.licensePlate})
                </MenuItem>
              ))}
            </Select>
            {errors.vehicleId && <FormHelperText>{errors.vehicleId}</FormHelperText>}
          </FormControl>
        )}
        
        <TextField
          margin="normal"
          fullWidth
          id="details"
          name="details"
          label="Détails de la demande"
          multiline
          rows={4}
          value={formData.details}
          onChange={handleTextChange}
          error={!!errors.details}
          helperText={errors.details || 'Veuillez fournir tous les détails nécessaires pour traiter votre demande.'}
        />
        
        {formData.type === 'schedule_change' && (
          <TextField
            margin="normal"
            fullWidth
            id="requestedDate"
            name="requestedDate"
            label="Date souhaitée"
            type="date"
            value={formData.requestedDate || ''}
            onChange={handleTextChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RequestForm; 