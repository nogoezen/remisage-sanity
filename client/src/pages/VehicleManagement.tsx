import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useAuth } from '../context/AuthContext';
import vehicleService, { Vehicle } from '../services/vehicleService';
import VehicleForm from '../components/VehicleForm';
import DeleteVehicleDialog from '../components/DeleteVehicleDialog';
import LocationChangeDialog from '../components/LocationChangeDialog';
import LocationHistoryDialog from '../components/LocationHistoryDialog';
import AssignVehicleDialog from '../components/AssignVehicleDialog';
import logger from '../utils/logger';

const VehicleManagement: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  
  // États pour les données
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les dialogues
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationChangeDialogOpen, setLocationChangeDialogOpen] = useState(false);
  const [locationHistoryDialogOpen, setLocationHistoryDialogOpen] = useState(false);
  const [assignVehicleDialogOpen, setAssignVehicleDialogOpen] = useState(false);
  
  // État pour le véhicule sélectionné
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Chargement des véhicules au montage du composant
  useEffect(() => {
    // Log des actions disponibles pour l'administrateur
    if (user) {
      const adminActions = [
        'Voir la liste complète des véhicules',
        'Ajouter de nouveaux véhicules',
        'Modifier les informations des véhicules existants',
        'Supprimer des véhicules',
        'Changer la localisation des véhicules',
        'Consulter l\'historique de localisation des véhicules',
        'Assigner des véhicules aux employés'
      ];
      
      logger.role('VehicleManagement', user, adminActions);
    }
    
    fetchVehicles();
  }, [user]);
  
  // Fonction pour récupérer les véhicules
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      logger.info('VehicleManagement', 'Récupération de tous les véhicules');
      const data = await vehicleService.getAll();
      setVehicles(Array.isArray(data) ? data : []);
      setError(null);
      logger.info('VehicleManagement', `${data.length} véhicules récupérés`);
    } catch (err) {
      logger.error('VehicleManagement', 'Erreur lors de la récupération des véhicules:', err);
      setError('Impossible de récupérer les véhicules');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour créer un véhicule
  const handleCreateVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      logger.info('VehicleManagement', 'Création d\'un nouveau véhicule', vehicleData);
      await vehicleService.create(vehicleData);
      logger.info('VehicleManagement', 'Véhicule créé avec succès');
      fetchVehicles();
      return true;
    } catch (err) {
      logger.error('VehicleManagement', 'Erreur lors de la création du véhicule:', err);
      throw err;
    }
  };
  
  // Fonction pour modifier un véhicule
  const handleUpdateVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!selectedVehicle) return false;
    
    try {
      logger.info('VehicleManagement', `Mise à jour du véhicule ${selectedVehicle.id}`, vehicleData);
      await vehicleService.update(selectedVehicle.id, vehicleData);
      logger.info('VehicleManagement', 'Véhicule mis à jour avec succès');
      fetchVehicles();
      return true;
    } catch (err) {
      logger.error('VehicleManagement', `Erreur lors de la mise à jour du véhicule ${selectedVehicle.id}:`, err);
      throw err;
    }
  };
  
  // Fonction pour supprimer un véhicule
  const handleDeleteVehicle = async (id: number): Promise<boolean> => {
    try {
      logger.info('VehicleManagement', `Suppression du véhicule ${id}`);
      await vehicleService.delete(id);
      logger.info('VehicleManagement', 'Véhicule supprimé avec succès');
      fetchVehicles();
      return true;
    } catch (err) {
      logger.error('VehicleManagement', `Erreur lors de la suppression du véhicule ${id}:`, err);
      throw err;
    }
  };
  
  // Fonction pour mettre à jour la localisation
  const handleLocationUpdate = async (vehicleId: number, address: string, latitude: number, longitude: number, previousAddress: string, previousLatitude: number, previousLongitude: number): Promise<boolean> => {
    try {
      await vehicleService.updateLocation(vehicleId, address, latitude, longitude, previousAddress, previousLatitude, previousLongitude);
      fetchVehicles();
      return true;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour de la localisation du véhicule ${vehicleId}:`, err);
      throw err;
    }
  };
  
  // Fonction pour déterminer la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return theme.palette.success.main;
      case 'assigned':
        return theme.palette.info.main;
      case 'maintenance':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Fonction pour traduire le statut en français
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'assigned':
        return 'Assigné';
      case 'maintenance':
        return 'En maintenance';
      default:
        return status;
    }
  };
  
  // Vérifier si l'utilisateur est admin
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Gestion des véhicules
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Ajouter un véhicule
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : vehicles.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucun véhicule n'est enregistré dans le système.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Modèle</TableCell>
                <TableCell>Immatriculation</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Assigné à</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(vehicle.status)} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getStatusColor(vehicle.status),
                        color: 'white'
                      }} 
                    />
                  </TableCell>
                  <TableCell>{vehicle.address || '-'}</TableCell>
                  <TableCell>
                    {vehicle.firstName && vehicle.lastName 
                      ? `${vehicle.firstName} ${vehicle.lastName}` 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Modifier">
                        <IconButton 
                          color="primary"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Supprimer">
                        <IconButton 
                          color="error"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Changer la localisation">
                        <IconButton 
                          color="info"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setLocationChangeDialogOpen(true);
                          }}
                        >
                          <LocationOnIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Historique des localisations">
                        <IconButton 
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setLocationHistoryDialogOpen(true);
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Assigner à un employé">
                        <IconButton 
                          color="secondary"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setAssignVehicleDialogOpen(true);
                          }}
                        >
                          <AssignmentIndIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialogue de création de véhicule */}
      <VehicleForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateVehicle}
        title="Ajouter un véhicule"
      />
      
      {/* Dialogue de modification de véhicule */}
      <VehicleForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateVehicle}
        vehicle={selectedVehicle}
        title="Modifier le véhicule"
      />
      
      {/* Dialogue de suppression de véhicule */}
      <DeleteVehicleDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteVehicle}
        vehicle={selectedVehicle}
      />
      
      {/* Dialogue de changement de localisation */}
      <LocationChangeDialog
        open={locationChangeDialogOpen}
        onClose={() => setLocationChangeDialogOpen(false)}
        onSubmit={handleLocationUpdate}
        vehicle={selectedVehicle}
      />
      
      {/* Dialogue d'historique de localisation */}
      {selectedVehicle && (
        <LocationHistoryDialog
          open={locationHistoryDialogOpen}
          onClose={() => setLocationHistoryDialogOpen(false)}
          vehicleId={selectedVehicle.id}
        />
      )}
      
      {/* Dialogue d'assignation de véhicule */}
      {selectedVehicle && (
        <AssignVehicleDialog
          open={assignVehicleDialogOpen}
          onClose={() => setAssignVehicleDialogOpen(false)}
          onSuccess={() => {
            setAssignVehicleDialogOpen(false);
            fetchVehicles();
          }}
          vehicleId={selectedVehicle.id}
        />
      )}
    </Box>
  );
};

export default VehicleManagement; 