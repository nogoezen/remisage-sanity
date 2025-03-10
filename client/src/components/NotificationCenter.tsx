import React, { useState, useEffect } from 'react';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MessageIcon from '@mui/icons-material/Message';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNotifications } from '../context/NotificationContext';
import { Notification, NotificationType } from '../services/notificationService';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  
  // État pour le menu
  const open = Boolean(anchorEl);
  
  // Surveiller les nouvelles notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      // Vérifier si c'est une nouvelle notification non lue
      if (!latestNotification.isRead && !newNotification) {
        setNewNotification(latestNotification);
        
        // Fermer automatiquement la notification après 6 secondes
        const timer = setTimeout(() => {
          setNewNotification(null);
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, newNotification]);
  
  // Ouvrir le menu des notifications
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Fermer le menu des notifications
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Marquer une notification comme lue et fermer le menu
  const handleNotificationClick = async (id: number) => {
    await markAsRead(id);
    handleClose();
  };
  
  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'vehicle_assignment':
        return <DirectionsCarIcon color="primary" />;
      case 'location_change':
        return <LocationOnIcon color="secondary" />;
      case 'message_received':
        return <MessageIcon color="info" />;
      case 'maintenance_alert':
        return <BuildIcon color="warning" />;
      case 'request_update':
        return <CheckCircleIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };
  
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          size="large"
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          color="inherit"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notifications-button',
        }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                markAllAsRead();
                handleClose();
              }}
            >
              Tout marquer comme lu
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification.id)}
                sx={{ 
                  backgroundColor: notification.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    backgroundColor: notification.isRead ? undefined : 'rgba(25, 118, 210, 0.12)',
                  }
                }}
              >
                <ListItem alignItems="flex-start" disablePadding>
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </MenuItem>
            ))}
          </List>
        )}
      </Menu>
      
      {/* Notification toast pour les nouvelles notifications */}
      <Snackbar
        open={!!newNotification}
        autoHideDuration={6000}
        onClose={() => setNewNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNewNotification(null)} 
          severity="info" 
          sx={{ width: '100%' }}
          icon={newNotification ? getNotificationIcon(newNotification.type) : undefined}
        >
          {newNotification?.title}: {newNotification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationCenter; 