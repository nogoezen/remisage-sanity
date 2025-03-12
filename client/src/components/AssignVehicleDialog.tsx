import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import vehicleService, { Vehicle } from '../services/vehicleService';
import { createVehicleAssignmentNotification } from '../utils/notificationUtils';
import api from '../services/api';

// Interface locale pour les utilisateurs
interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  has_vehicle_assigned: boolean;
  assignedVehicles: any[] | null;
}

interface AssignVehicleDialogProps {
  vehicleId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignVehicleDialog: React.FC<AssignVehicleDialogProps> = ({
  vehicleId,
  open,
  onClose,
  onSuccess
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Charger les données initiales (véhicule et utilisateurs)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setError(null);
      
      try {
        // Récupérer les informations du véhicule
        const vehicleData = await vehicleService.getById(vehicleId);
        setVehicle(vehicleData);
        
        // Si le véhicule est déjà assigné, présélectionner l'utilisateur
        if (vehicleData.assignedTo) {
          setSelectedUserId(vehicleData.assignedTo);
        } else {
          setSelectedUserId('');
        }
        
        // Récupérer la liste des utilisateurs (employés)
        const response = await api.get('/users?role=employee');
        
        // Récupérer tous les utilisateurs
        let allUsers: UserData[] = [];
        if (response.data && response.data.users) {
          allUsers = response.data.users;
        } else if (Array.isArray(response.data)) {
          allUsers = response.data;
        }
        
        console.log('Tous les utilisateurs:', allUsers);
        
        // Filtrer les utilisateurs qui peuvent se faire assigner un véhicule
        // Inclure tous les utilisateurs qui ont has_vehicle_assigned à true
        // et l'utilisateur actuellement assigné au véhicule (s'il y en a un)
        const eligibleUsers = allUsers.filter(user => {
          // L'utilisateur doit avoir has_vehicle_assigned à true
          const canBeAssigned = user.has_vehicle_assigned;
          
          // Si l'utilisateur est déjà assigné à ce véhicule, l'inclure
          const isCurrentlyAssigned = vehicleData.assignedTo === user.id;
          
          return canBeAssigned || isCurrentlyAssigned;
        });
        
        console.log('Utilisateurs éligibles:', eligibleUsers);
        setUsers(eligibleUsers);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [vehicleId, open]);

  // Gérer le changement d'utilisateur sélectionné
  const handleUserChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedUserId(event.target.value as number | '');
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Si selectedUserId est vide, cela signifie que l'utilisateur veut désassigner le véhicule
      if (selectedUserId === '') {
        console.log(`Désassignation du véhicule ${vehicleId}`);
        const response = await vehicleService.assignToUser(vehicleId, 0); // Envoyer 0 pour désassigner
        console.log('Réponse de la désassignation:', response);
        
        setSuccess(true);
        
        // Appeler le callback de succès si fourni
        if (onSuccess) {
          console.log('Appel du callback de succès après désassignation');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
        
        return;
      }
      
      // Sinon, assigner le véhicule à l'utilisateur sélectionné
      console.log(`Assignation du véhicule ${vehicleId} à l'utilisateur ${selectedUserId}`);
      const response = await vehicleService.assignToUser(vehicleId, selectedUserId as number);
      console.log('Réponse de l\'assignation:', response);
      
      setSuccess(true);
      
      // Créer une notification pour l'utilisateur assigné
      if (vehicle && typeof selectedUserId === 'number') {
        console.log(`Création d'une notification pour l'utilisateur ${selectedUserId}`);
        await createVehicleAssignmentNotification(
          vehicleId,
          vehicle.model,
          vehicle.licensePlate,
          selectedUserId
        );
      }
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        console.log('Appel du callback de succès');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'assignation du véhicule:', err);
      
      // Vérifier si l'erreur est due à un utilisateur qui ne peut pas se faire assigner un véhicule
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.user) {
        const { firstName, lastName } = err.response.data.user;
        setError(`Impossible d'assigner le véhicule à ${firstName} ${lastName}. Cet employé n'est pas autorisé à avoir un véhicule.`);
      } else if (err.response && err.response.data && err.response.data.error) {
        // Afficher le message d'erreur renvoyé par le serveur
        setError(err.response.data.error);
      } else {
        setError('Impossible d\'assigner le véhicule. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser l'état lors de la fermeture
  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? handleClose : undefined}
      aria-labelledby="assign-vehicle-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="assign-vehicle-dialog-title">
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Assigner un véhicule à un employé
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Le véhicule a été assigné avec succès!
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <DialogContentText sx={{ mb: 3 }}>
            Veuillez sélectionner l'employé auquel vous souhaitez assigner le véhicule 
            {vehicle && ` ${vehicle.model} (${vehicle.licensePlate})`}.
          </DialogContentText>
        )}
        
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {vehicle && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {vehicle.model}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Immatriculation: {vehicle.licensePlate}
                </Typography>
                <Typography variant="body2">
                  Statut: {vehicle.status === 'available' ? 'Disponible' : 
                          vehicle.status === 'assigned' ? 'Assigné' : 'En maintenance'}
                </Typography>
                {vehicle.assignedTo && vehicle.firstName && vehicle.lastName && (
                  <Typography variant="body2">
                    Actuellement assigné à: {vehicle.firstName} {vehicle.lastName}
                  </Typography>
                )}
              </Box>
            )}
            
            <FormControl fullWidth sx={{ mb: 2 }} disabled={loading || success}>
              <InputLabel id="user-select-label">Employé</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUserId}
                label="Employé"
                onChange={handleUserChange}
              >
                <MenuItem value="">
                  <em>Aucun (retirer l'assignation)</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          disabled={loading || loadingData || success}
          variant="contained"
        >
          {loading ? <CircularProgress size={24} /> : 'Assigner'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignVehicleDialog; 