import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Divider,
  Button,
  CircularProgress,
  Alert,
  Container,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import EmergencyButton from '../components/EmergencyButton';
import EmployeeVehicleMap from '../components/EmployeeVehicleMap';
import RequestForm from '../components/RequestForm';
import NotificationCenter from '../components/NotificationCenter';
import LocationChangeDialog from '../components/LocationChangeDialog';
import LocationHistoryDialog from '../components/LocationHistoryDialog';
import vehicleService, { Vehicle } from '../services/vehicleService';
import requestService, { Request } from '../services/requestService';
import userService, { User } from '../services/userService';
import logger from '../utils/logger';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonIcon from '@mui/icons-material/Person';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // États pour les données
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [locationChangeCount, setLocationChangeCount] = useState<number>(0);
  
  // États pour les dialogues
  const [locationChangeDialogOpen, setLocationChangeDialogOpen] = useState(false);
  const [locationHistoryDialogOpen, setLocationHistoryDialogOpen] = useState(false);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chargement des données au montage du composant
  useEffect(() => {
    if (user) {
      logger.info('EmployeeDashboard', 'Chargement des données pour l\'employé', user.id);
      fetchVehicles();
      fetchRequests();
      fetchLocationChangeCount();
    }
  }, [user]);
  
  // Récupération des véhicules assignés à l'employé
  const fetchVehicles = async () => {
    try {
      logger.info('EmployeeDashboard', 'Récupération des véhicules assignés');
      setLoading(true);
      const data = await vehicleService.getAll();
      logger.debug('EmployeeDashboard', 'Véhicules récupérés:', data);
      
      // Filtrer pour ne garder que les véhicules assignés à l'utilisateur actuel
      const assignedVehicles = Array.isArray(data) 
        ? data.filter(v => v.assignedTo === user?.id)
        : [];
      
      setVehicles(assignedVehicles);
      
      // Définir le premier véhicule assigné comme véhicule actif
      if (assignedVehicles.length > 0) {
        setAssignedVehicle(assignedVehicles[0]);
      }
      
      setError(null);
    } catch (err) {
      logger.error('EmployeeDashboard', 'Erreur lors de la récupération des véhicules:', err);
      setError('Impossible de récupérer les véhicules');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Récupération des demandes de l'employé
  const fetchRequests = async () => {
    try {
      const data = await requestService.getAll();
      // Filtrer pour ne garder que les demandes de l'utilisateur actuel
      const userRequests = Array.isArray(data) 
        ? data.filter(r => r.userId === user?.id)
        : [];
      setRequests(userRequests);
    } catch (err) {
      logger.error('EmployeeDashboard', 'Erreur lors de la récupération des demandes:', err);
      setRequests([]);
    }
  };
  
  // Récupération du nombre de changements de localisation ce mois-ci
  const fetchLocationChangeCount = async () => {
    try {
      // Cette fonction devrait être implémentée dans le service
      // Pour l'instant, on utilise une valeur fictive
      setLocationChangeCount(3);
    } catch (err) {
      logger.error('EmployeeDashboard', 'Erreur lors de la récupération du nombre de changements de localisation:', err);
      setLocationChangeCount(0);
    }
  };
  
  // Gestion du changement de localisation
  const handleChangeLocation = (id: number) => {
    logger.info('EmployeeDashboard', `Changement de localisation pour le véhicule ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      logger.error('EmployeeDashboard', `ID de véhicule invalide: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      logger.debug('EmployeeDashboard', 'Véhicule trouvé:', vehicle);
      setAssignedVehicle(vehicle);
      setLocationChangeDialogOpen(true);
    } else {
      logger.error('EmployeeDashboard', `Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  // Gestion de l'affichage de l'historique
  const handleViewHistory = (id: number) => {
    logger.info('EmployeeDashboard', `Affichage de l'historique pour le véhicule ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      logger.error('EmployeeDashboard', `ID de véhicule invalide: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      logger.debug('EmployeeDashboard', 'Véhicule trouvé:', vehicle);
      setAssignedVehicle(vehicle);
      setLocationHistoryDialogOpen(true);
    } else {
      logger.error('EmployeeDashboard', `Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  // Gestion de la mise à jour de la localisation
  const handleLocationUpdate = async (
    vehicleId: number, 
    address: string, 
    latitude: number, 
    longitude: number,
    previousAddress?: string,
    previousLatitude?: number,
    previousLongitude?: number
  ): Promise<boolean> => {
    try {
      logger.info('EmployeeDashboard', 'Mise à jour de la localisation:', {
        vehicleId,
        address,
        latitude,
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      });
      
      // Vérification de l'ID du véhicule
      if (vehicleId === undefined || vehicleId === null || isNaN(Number(vehicleId)) || Number(vehicleId) <= 0) {
        logger.error('EmployeeDashboard', 'ID de véhicule invalide:', vehicleId);
        
        // Si assignedVehicle est défini, utiliser son ID
        if (assignedVehicle && assignedVehicle.id && Number(assignedVehicle.id) > 0) {
          logger.info('EmployeeDashboard', 'Utilisation de l\'ID du véhicule assigné:', assignedVehicle.id);
          vehicleId = assignedVehicle.id;
        } else {
          logger.error('EmployeeDashboard', 'Aucun ID de véhicule valide disponible');
          return false;
        }
      }
      
      // Convertir l'ID en nombre
      const numericVehicleId = Number(vehicleId);
      
      await vehicleService.updateLocation(
        numericVehicleId, 
        address, 
        latitude, 
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      );
      
      // Rafraîchir les données
      fetchVehicles();
      fetchLocationChangeCount();
      return true;
    } catch (err) {
      logger.error('EmployeeDashboard', 'Erreur lors de la mise à jour de la localisation:', err);
      return false;
    }
  };
  
  // Gestion de la soumission d'une demande
  const handleRequestSubmit = async (requestData: any): Promise<boolean> => {
    try {
      await requestService.create(requestData);
      // Rafraîchir la liste des demandes
      fetchRequests();
      return true;
    } catch (err) {
      logger.error('EmployeeDashboard', 'Erreur lors de la création de la demande:', err);
      return false;
    }
  };
  
  // Formatage de la date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Non disponible';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* En-tête avec bouton d'urgence */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tableau de bord
          </Typography>
          <EmergencyButton />
        </Box>
        
        <Grid container spacing={3}>
          {/* Informations utilisateur */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mb: 2,
                    bgcolor: theme.palette.primary.main
                  }}
                >
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employé depuis le {new Date().toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <NotificationCenter />
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Carte du véhicule */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Mon véhicule
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : !assignedVehicle ? (
                <Alert severity="info">
                  Aucun véhicule ne vous est assigné actuellement.
                </Alert>
              ) : (
                <Box sx={{ height: 400 }}>
                  <EmployeeVehicleMap />
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Informations sur le véhicule */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Détails du véhicule
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : !assignedVehicle ? (
                <Alert severity="info">
                  Aucun véhicule ne vous est assigné actuellement.
                </Alert>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DirectionsCarIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {assignedVehicle.model} ({assignedVehicle.licensePlate})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {assignedVehicle.address || 'Adresse non définie'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarTodayIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Assigné depuis: {formatDate(assignedVehicle.updatedAt)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SpeedIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Changements d'adresse ce mois: {locationChangeCount}/5
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => handleViewHistory(assignedVehicle.id)}
                    >
                      Historique
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleChangeLocation(assignedVehicle.id)}
                    >
                      Changer l'adresse
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
          
          {/* Formulaire de demande */}
          <Grid item xs={12} md={8}>
            <RequestForm 
              vehicles={vehicles} 
              onSubmit={handleRequestSubmit} 
            />
          </Grid>
          
          {/* Demandes récentes */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Mes demandes récentes
              </Typography>
              
              {requests.length === 0 ? (
                <Alert severity="info">
                  Vous n'avez pas encore fait de demandes.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {requests.slice(0, 3).map((request) => (
                    <Grid item xs={12} md={4} key={`request-${request.id}`}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">
                            {request.type === 'vehicle_change' ? 'Changement de véhicule' :
                             request.type === 'location_change' ? 'Changement d\'adresse' :
                             request.type === 'maintenance' ? 'Maintenance' : 
                             request.type === 'schedule_change' ? 'Changement d\'horaire' : 'Autre'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Statut: {request.status === 'pending' ? 'En attente' :
                                    request.status === 'approved' ? 'Approuvé' :
                                    request.status === 'rejected' ? 'Rejeté' : 'Complété'}
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {request.details}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Créée le {formatDate(request.createdAt)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Dialogues */}
      <LocationChangeDialog 
        open={locationChangeDialogOpen}
        onClose={() => setLocationChangeDialogOpen(false)}
        onSubmit={handleLocationUpdate}
        vehicle={assignedVehicle}
      />
      
      <LocationHistoryDialog 
        open={locationHistoryDialogOpen}
        onClose={() => setLocationHistoryDialogOpen(false)}
        vehicleId={assignedVehicle?.id || 0}
      />
    </Container>
  );
};

export default EmployeeDashboard; 