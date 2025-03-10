import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  CardActions, 
  Button, 
  Box, 
  Chip,
  Divider,
  useTheme,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import { Vehicle } from '../services/vehicleService';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onViewHistory?: (id: number) => void;
  onChangeLocation?: (id: number) => void;
  onAssign?: (id: number) => void;
  isAdmin?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
  onViewHistory,
  onChangeLocation,
  onAssign,
  isAdmin = false
}) => {
  const theme = useTheme();

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

  return (
    <Card
      sx={{
        minWidth: 275,
        maxWidth: 500,
        mb: 2,
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        }
      }}
    >
      {/* En-tête de la carte avec une couleur de fond basée sur le statut */}
      <Box 
        sx={{ 
          bgcolor: getStatusColor(vehicle.status),
          color: 'white',
          py: 1,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DirectionsCarIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" fontWeight="bold">
            {vehicle.model}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(vehicle.status)}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      <CardContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <Box component="span" sx={{ 
            bgcolor: theme.palette.grey[200], 
            px: 1, 
            py: 0.5, 
            borderRadius: 1,
            display: 'inline-block',
            width: '100%',
            textAlign: 'center'
          }}>
            {vehicle.licensePlate}
          </Box>
        </Typography>

        <Stack spacing={1.5}>
          {vehicle.address && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vehicle.address}
              </Typography>
            </Box>
          )}

          {vehicle.firstName && vehicle.lastName && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
              <Typography variant="body2" color="text.secondary">
                Assigné à: <Box component="span" fontWeight="bold">{vehicle.firstName} {vehicle.lastName}</Box>
              </Typography>
            </Box>
          )}

          {vehicle.updatedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
              <Typography variant="body2" color="text.secondary">
                Dernière mise à jour: {new Date(vehicle.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, p: 1.5 }}>
        <Box>
          {onViewHistory && (
            <Tooltip title="Historique des localisations">
              <IconButton 
                size="small" 
                color="info"
                onClick={() => onViewHistory(vehicle.id)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {onChangeLocation && (
            <Tooltip title="Changer la localisation">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onChangeLocation(vehicle.id)}
              >
                <LocationOnIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {isAdmin && onAssign && (
            <Tooltip title="Assigner à un employé">
              <IconButton 
                size="small" 
                color="secondary"
                onClick={() => onAssign(vehicle.id)}
              >
                <AssignmentIndIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {isAdmin && (
          <Box>
            {onEdit && (
              <Tooltip title="Modifier le véhicule">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onEdit(vehicle.id)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip title="Supprimer le véhicule">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onDelete(vehicle.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

export default VehicleCard; 