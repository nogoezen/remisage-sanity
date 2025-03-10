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
  Tab,
  Tabs,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import VehicleCard from '../components/VehicleCard';
import RequestForm from '../components/RequestForm';
import MessageList from '../components/MessageList';
import LocationChangeDialog from '../components/LocationChangeDialog';
import LocationHistoryDialog from '../components/LocationHistoryDialog';
import NewMessageDialog from '../components/NewMessageDialog';
import MessageDetailDialog from '../components/MessageDetailDialog';
import AssignVehicleDialog from '../components/AssignVehicleDialog';
import AdminVehicleMap from '../components/AdminVehicleMap';
import vehicleService, { Vehicle } from '../services/vehicleService';
import messageService, { Message } from '../services/messageService';
import requestService, { Request } from '../services/requestService';
import userService, { User } from '../services/userService';
import logger from '../utils/logger';
import AddIcon from '@mui/icons-material/Add';
import VehicleForm from '../components/VehicleForm';
import DeleteVehicleDialog from '../components/DeleteVehicleDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);
  
  // États pour les données
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  
  // États pour les dialogues
  const [locationChangeDialogOpen, setLocationChangeDialogOpen] = useState(false);
  const [locationHistoryDialogOpen, setLocationHistoryDialogOpen] = useState(false);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [messageDetailDialogOpen, setMessageDetailDialogOpen] = useState(false);
  const [assignVehicleDialogOpen, setAssignVehicleDialogOpen] = useState(false);
  const [createVehicleDialogOpen, setCreateVehicleDialogOpen] = useState(false);
  const [editVehicleDialogOpen, setEditVehicleDialogOpen] = useState(false);
  const [deleteVehicleDialogOpen, setDeleteVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chargement des données au montage du composant
  useEffect(() => {
    // Log des actions disponibles en fonction du rôle
    if (user) {
      const adminActions = [
        'Voir tous les véhicules',
        'Créer, modifier et supprimer des véhicules',
        'Assigner des véhicules aux employés',
        'Gérer les demandes de tous les employés',
        'Accéder à la liste complète des utilisateurs'
      ];
      
      const employeeActions = [
        'Voir les véhicules qui vous sont assignés',
        'Mettre à jour la localisation de vos véhicules',
        'Consulter l\'historique de localisation de vos véhicules',
        'Créer des demandes',
        'Envoyer des messages'
      ];
      
      logger.role('Dashboard', user, user.role === 'admin' ? adminActions : employeeActions);
    }
    
    fetchVehicles();
    fetchMessages();
    fetchRequests();
    fetchUsers();
  }, [user]);
  
  // Récupération des véhicules
  const fetchVehicles = async () => {
    try {
      logger.info('Dashboard', 'Récupération des véhicules');
      setLoading(true);
      const data = await vehicleService.getAll();
      logger.debug('Dashboard', 'Véhicules récupérés:', data);
      // S'assurer que data est un tableau
      setVehicles(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      logger.error('Dashboard', 'Erreur lors de la récupération des véhicules:', err);
      setError('Impossible de récupérer les véhicules');
      setVehicles([]); // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };
  
  // Récupération des messages
  const fetchMessages = async () => {
    try {
      const data = await messageService.getAll();
      // S'assurer que data est un tableau
      const safeData = Array.isArray(data) ? data : [];
      setMessages(safeData);
      
      // Compter les messages non lus
      const unread = safeData.filter((message: Message) => !message.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur lors de la récupération des messages:', err);
      setMessages([]); // Initialiser avec un tableau vide en cas d'erreur
      setUnreadCount(0);
    }
  };
  
  // Récupération des demandes
  const fetchRequests = async () => {
    try {
      const data = await requestService.getAll();
      // S'assurer que data est un tableau
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes:', err);
      setRequests([]); // Initialiser avec un tableau vide en cas d'erreur
    }
  };
  
  // Récupération des utilisateurs
  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    }
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Gestion de la soumission d'une demande
  const handleRequestSubmit = async (requestData: any): Promise<boolean> => {
    try {
      await requestService.create(requestData);
      // Rafraîchir la liste des demandes
      fetchRequests();
      return true;
    } catch (err) {
      console.error('Erreur lors de la création de la demande:', err);
      return false;
    }
  };
  
  // Gestion du clic sur un message
  const handleMessageClick = async (message: Message) => {
    setSelectedMessageId(message.id);
    setMessageDetailDialogOpen(true);
  };
  
  // Gestion de la fermeture du dialogue de détail de message
  const handleMessageDetailClose = () => {
    setMessageDetailDialogOpen(false);
    setSelectedMessageId(null);
  };
  
  // Callback après qu'un message a été lu
  const handleMessageRead = () => {
    fetchMessages();
  };
  
  // Gestion de l'archivage d'un message
  const handleArchiveMessage = async (id: number) => {
    try {
      await messageService.archive(id);
      // Rafraîchir la liste des messages
      fetchMessages();
      return Promise.resolve();
    } catch (err) {
      console.error('Erreur lors de l\'archivage du message:', err);
      return Promise.reject(err);
    }
  };
  
  // Gestion du désarchivage d'un message
  const handleUnarchiveMessage = async (id: number) => {
    try {
      await messageService.unarchive(id);
      // Rafraîchir la liste des messages
      fetchMessages();
      return Promise.resolve();
    } catch (err) {
      console.error('Erreur lors du désarchivage du message:', err);
      return Promise.reject(err);
    }
  };
  
  // Gestion de la suppression d'un message
  const handleDeleteMessage = async (id: number) => {
    try {
      await messageService.delete(id);
      // Rafraîchir la liste des messages
      fetchMessages();
      return Promise.resolve();
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err);
      return Promise.reject(err);
    }
  };
  
  // Gestion du changement de localisation
  const handleChangeLocation = (id: number) => {
    console.log(`Dashboard - handleChangeLocation: Recherche du véhicule avec l'ID ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      console.error(`Invalid vehicle ID: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log('Dashboard - handleChangeLocation: Véhicule trouvé:', JSON.stringify(vehicle, null, 2));
      setSelectedVehicle(vehicle);
      setLocationChangeDialogOpen(true);
    } else {
      console.error(`Dashboard - handleChangeLocation: Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  // Gestion de l'affichage de l'historique
  const handleViewHistory = (id: number) => {
    console.log(`Dashboard - handleViewHistory: Recherche du véhicule avec l'ID ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      console.error(`Invalid vehicle ID: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log('Dashboard - handleViewHistory: Véhicule trouvé:', JSON.stringify(vehicle, null, 2));
      setSelectedVehicle(vehicle);
      setLocationHistoryDialogOpen(true);
    } else {
      console.error(`Dashboard - handleViewHistory: Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  // Gestion de l'envoi d'un message
  const handleSendMessage = async (messageData: any): Promise<boolean> => {
    try {
      await messageService.send(messageData);
      // Rafraîchir la liste des messages
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      return false;
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
      console.log('Dashboard - handleLocationUpdate:', {
        vehicleId,
        address,
        latitude,
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      });
      
      // Vérification plus robuste de l'ID du véhicule
      if (vehicleId === undefined || vehicleId === null || isNaN(Number(vehicleId)) || Number(vehicleId) <= 0) {
        console.error('Vehicle ID is invalid in handleLocationUpdate:', vehicleId);
        
        // Si selectedVehicle est défini, utiliser son ID
        if (selectedVehicle && selectedVehicle.id && Number(selectedVehicle.id) > 0) {
          console.log('Using selectedVehicle.id instead:', selectedVehicle.id);
          vehicleId = selectedVehicle.id;
        } else {
          console.error('No valid vehicle ID available');
          return false;
        }
      }
      
      // Convertir l'ID en nombre pour s'assurer qu'il est du bon type
      const numericVehicleId = Number(vehicleId);
      console.log('Using numeric vehicle ID:', numericVehicleId);
      
      if (isNaN(numericVehicleId) || numericVehicleId <= 0) {
        console.error(`Invalid numeric vehicle ID: ${numericVehicleId}`);
        return false;
      }
      
      await vehicleService.updateLocation(
        numericVehicleId, 
        address, 
        latitude, 
        longitude,
        previousAddress,
        previousLatitude,
        previousLongitude
      );
      
      // Rafraîchir la liste des véhicules
      fetchVehicles();
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la localisation:', err);
      return false;
    }
  };
  
  // Gestion de l'assignation de véhicule
  const handleAssignVehicle = (id: number) => {
    console.log(`Dashboard - handleAssignVehicle: Assignation du véhicule ${id}`);
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log('Dashboard - handleAssignVehicle: Véhicule trouvé:', vehicle);
      setSelectedVehicle(vehicle);
      setAssignVehicleDialogOpen(true);
    }
  };

  // Fermeture du dialogue d'assignation
  const handleAssignVehicleClose = () => {
    console.log('Dashboard - handleAssignVehicleClose: Fermeture du dialogue d\'assignation');
    setAssignVehicleDialogOpen(false);
  };

  // Callback après une assignation réussie
  const handleAssignVehicleSuccess = () => {
    console.log('Dashboard - handleAssignVehicleSuccess: Assignation réussie, rafraîchissement des véhicules');
    fetchVehicles();
    setAssignVehicleDialogOpen(false);
  };
  
  // Gestion de la création d'un véhicule
  const handleCreateVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      await vehicleService.create(vehicleData);
      // Rafraîchir la liste des véhicules
      fetchVehicles();
      return true;
    } catch (err) {
      console.error('Erreur lors de la création du véhicule:', err);
      return false;
    }
  };
  
  // Gestion de la modification d'un véhicule
  const handleUpdateVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!selectedVehicle) return false;
    
    console.log('Dashboard - handleUpdateVehicle: Véhicule sélectionné:', JSON.stringify(selectedVehicle, null, 2));
    
    // Validation de l'ID
    if (selectedVehicle.id === undefined || selectedVehicle.id === null) {
      console.error('Vehicle ID is undefined or null in handleUpdateVehicle');
      return false;
    }
    
    // Vérifier que l'ID est un nombre valide
    const numericId = Number(selectedVehicle.id);
    if (isNaN(numericId) || numericId <= 0) {
      console.error(`Invalid numeric ID: ${numericId} from vehicle ID: ${selectedVehicle.id}`);
      return false;
    }
    
    try {
      console.log(`Dashboard - handleUpdateVehicle: Mise à jour du véhicule ${numericId}`, JSON.stringify(vehicleData, null, 2));
      await vehicleService.update(numericId, vehicleData);
      
      // Rafraîchir la liste des véhicules
      fetchVehicles();
      return true;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du véhicule ${selectedVehicle.id}:`, err);
      return false;
    }
  };
  
  // Gestion de la suppression d'un véhicule
  const handleDeleteVehicle = async (id: number): Promise<boolean> => {
    try {
      console.log(`Dashboard - handleDeleteVehicle: Suppression du véhicule avec l'ID: ${id}`);
      
      // Validation de l'ID
      if (id === undefined || id === null || isNaN(Number(id))) {
        console.error('Vehicle ID is invalid in handleDeleteVehicle:', id);
        
        // Si selectedVehicle est défini, utiliser son ID
        if (selectedVehicle && selectedVehicle.id) {
          console.log('Using selectedVehicle.id instead:', selectedVehicle.id);
          id = selectedVehicle.id;
        } else {
          console.error('No valid vehicle ID available');
          return false;
        }
      }
      
      // Convertir l'ID en nombre pour s'assurer qu'il est du bon type
      const numericId = Number(id);
      console.log('Using numeric vehicle ID for deletion:', numericId);
      
      await vehicleService.delete(numericId);
      
      // Rafraîchir la liste des véhicules
      fetchVehicles();
      return true;
    } catch (err) {
      console.error(`Erreur lors de la suppression du véhicule ${id}:`, err);
      return false;
    }
  };
  
  // Gestion de l'édition d'un véhicule
  const handleEditVehicle = (id: number) => {
    console.log(`Dashboard - handleEditVehicle: Recherche du véhicule avec l'ID ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      console.error(`Invalid vehicle ID: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log('Dashboard - handleEditVehicle: Véhicule trouvé:', JSON.stringify(vehicle, null, 2));
      setSelectedVehicle(vehicle);
      setEditVehicleDialogOpen(true);
    } else {
      console.error(`Dashboard - handleEditVehicle: Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  // Gestion de la suppression d'un véhicule (ouverture du dialogue)
  const handleDeleteVehicleClick = (id: number) => {
    console.log(`Dashboard - handleDeleteVehicleClick: Recherche du véhicule avec l'ID ${id}`);
    
    // Validation de l'ID
    if (id === undefined || id === null || isNaN(Number(id)) || id <= 0) {
      console.error(`Invalid vehicle ID: ${id}`);
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      console.log('Dashboard - handleDeleteVehicleClick: Véhicule trouvé:', JSON.stringify(vehicle, null, 2));
      setSelectedVehicle(vehicle);
      setDeleteVehicleDialogOpen(true);
    } else {
      console.error(`Dashboard - handleDeleteVehicleClick: Véhicule avec l'ID ${id} non trouvé`);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Véhicules" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Messages" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Demandes" id="tab-2" aria-controls="tabpanel-2" />
          {user?.role === 'admin' && (
            <Tab label="Utilisateurs" id="tab-3" aria-controls="tabpanel-3" />
          )}
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            {user?.role === 'admin' ? 'Tous les véhicules' : 'Mes véhicules assignés'}
          </Typography>
          
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateVehicleDialogOpen(true)}
            >
              Nouveau véhicule
            </Button>
          )}
        </Box>
        
        {/* Carte des véhicules */}
        <Box sx={{ mb: 4 }}>
          <AdminVehicleMap />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !vehicles || vehicles.length === 0 ? (
          <Alert severity="info">
            {user?.role === 'admin' 
              ? 'Aucun véhicule n\'est enregistré dans le système.' 
              : 'Aucun véhicule ne vous est assigné actuellement.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {Array.isArray(vehicles) && vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} key={`vehicle-${vehicle.id}`}>
                <VehicleCard 
                  vehicle={vehicle} 
                  onChangeLocation={handleChangeLocation}
                  onViewHistory={handleViewHistory}
                  onAssign={user?.role === 'admin' ? handleAssignVehicle : undefined}
                  onEdit={user?.role === 'admin' ? handleEditVehicle : undefined}
                  onDelete={user?.role === 'admin' ? handleDeleteVehicleClick : undefined}
                  isAdmin={user?.role === 'admin'}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Messages {unreadCount > 0 && `(${unreadCount} non lu${unreadCount > 1 ? 's' : ''})`}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setNewMessageDialogOpen(true)}
          >
            Nouveau message
          </Button>
        </Box>
        
        <MessageList 
          messages={messages}
          onMessageClick={handleMessageClick}
          onArchive={id => handleArchiveMessage(id)}
          onUnarchive={id => handleUnarchiveMessage(id)}
          onDelete={id => handleDeleteMessage(id)}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Mes demandes
            </Typography>
            {!requests || requests.length === 0 ? (
              <Alert severity="info">
                Vous n'avez pas encore fait de demandes.
              </Alert>
            ) : (
              <Box>
                {Array.isArray(requests) && requests.map((request) => (
                  <Card key={`request-${request.id}`} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        {request.type === 'vehicle_change' ? 'Changement de véhicule' :
                         request.type === 'location_change' ? 'Changement d\'adresse' :
                         request.type === 'maintenance' ? 'Maintenance' : 'Autre'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Statut: {request.status === 'pending' ? 'En attente' :
                                request.status === 'approved' ? 'Approuvé' :
                                request.status === 'rejected' ? 'Rejeté' : 'Complété'}
                      </Typography>
                      <Typography variant="body2">
                        {request.details}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Nouvelle demande
            </Typography>
            <RequestForm onSubmit={handleRequestSubmit} vehicles={vehicles} />
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" gutterBottom>
          Gestion des utilisateurs
        </Typography>
        {users.length === 0 ? (
          <Alert severity="info">
            Aucun utilisateur trouvé.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {users.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={`user-${user.id}`}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Typography variant="body2">
                      Rôle: {user.role === 'admin' ? 'Administrateur' : 'Employé'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      {/* Dialogues */}
      <LocationChangeDialog 
        open={locationChangeDialogOpen}
        onClose={() => setLocationChangeDialogOpen(false)}
        onSubmit={handleLocationUpdate}
        vehicle={selectedVehicle}
      />
      
      <LocationHistoryDialog 
        open={locationHistoryDialogOpen}
        onClose={() => setLocationHistoryDialogOpen(false)}
        vehicleId={selectedVehicle?.id || 0}
      />
      
      <NewMessageDialog 
        open={newMessageDialogOpen}
        onClose={() => setNewMessageDialogOpen(false)}
        onSubmit={handleSendMessage}
        users={users}
      />
      
      <MessageDetailDialog
        open={messageDetailDialogOpen}
        onClose={handleMessageDetailClose}
        messageId={selectedMessageId}
        onArchive={handleArchiveMessage}
        onUnarchive={handleUnarchiveMessage}
        onDelete={handleDeleteMessage}
        onMessageRead={handleMessageRead}
      />
      
      <AssignVehicleDialog
        open={assignVehicleDialogOpen}
        onClose={handleAssignVehicleClose}
        vehicleId={selectedVehicle?.id || 0}
        onSuccess={handleAssignVehicleSuccess}
      />
      
      {/* Dialogue de création de véhicule */}
      <VehicleForm
        open={createVehicleDialogOpen}
        onClose={() => setCreateVehicleDialogOpen(false)}
        onSubmit={handleCreateVehicle}
        title="Ajouter un véhicule"
      />
      
      {/* Dialogue de modification de véhicule */}
      <VehicleForm
        open={editVehicleDialogOpen}
        onClose={() => setEditVehicleDialogOpen(false)}
        onSubmit={handleUpdateVehicle}
        vehicle={selectedVehicle}
        title="Modifier le véhicule"
      />
      
      {/* Dialogue de suppression de véhicule */}
      <DeleteVehicleDialog
        open={deleteVehicleDialogOpen}
        onClose={() => setDeleteVehicleDialogOpen(false)}
        onConfirm={handleDeleteVehicle}
        vehicle={selectedVehicle}
      />
    </Box>
  );
};

export default Dashboard; 