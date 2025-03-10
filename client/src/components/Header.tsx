import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  DirectionsCar, 
  Dashboard as DashboardIcon,
  Logout,
  Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = () => {
    logger.info('Header', 'Déconnexion de l\'utilisateur');
    logout();
    handleClose();
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };
  
  const handleDashboard = () => {
    handleClose();
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/employee-dashboard');
    }
  };
  
  // Déterminer le texte du tableau de bord en fonction du rôle
  const getDashboardText = () => {
    return user?.role === 'admin' ? 'Tableau de bord' : 'Mon espace';
  };
  
  // Déterminer le chemin du tableau de bord en fonction du rôle
  const getDashboardPath = () => {
    return user?.role === 'admin' ? '/dashboard' : '/employee-dashboard';
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
          {user?.firstName?.charAt(0) || 'U'}
        </Avatar>
        <Typography variant="subtitle1">
          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button component={RouterLink} to={getDashboardPath()}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary={getDashboardText()} />
        </ListItem>
        
        {user?.role === 'admin' && (
          <ListItem button component={RouterLink} to="/vehicles">
            <ListItemIcon>
              <DirectionsCar />
            </ListItemIcon>
            <ListItemText primary="Gestion des véhicules" />
          </ListItem>
        )}
        
        <ListItem button component={RouterLink} to="/profile">
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText primary="Profil" />
        </ListItem>
        
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        {isAuthenticated && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Remisage
        </Typography>
        
        {isAuthenticated ? (
          <>
            {!isMobile && (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to={getDashboardPath()}
                >
                  {getDashboardText()}
                </Button>
                
                {user?.role === 'admin' && (
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/vehicles"
                  >
                    Véhicules
                  </Button>
                )}
              </>
            )}
            
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>Profil</MenuItem>
              <MenuItem onClick={handleDashboard}>{getDashboardText()}</MenuItem>
              <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Connexion
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Inscription
            </Button>
          </>
        )}
      </Toolbar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Header; 