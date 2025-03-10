import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, token } = useAuth();
  
  console.log('ProtectedRoute - État d\'authentification:', { isAuthenticated, loading, hasToken: !!token });
  console.log('ProtectedRoute - Rôles autorisés:', allowedRoles);
  console.log('ProtectedRoute - Rôle de l\'utilisateur:', user?.role);

  // Si le chargement est en cours, afficher un indicateur de chargement
  if (loading) {
    console.log('ProtectedRoute - Chargement en cours...');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated && !token) {
    console.log('ProtectedRoute - Utilisateur non authentifié, redirection vers la page de connexion');
    return <Navigate to="/login" />;
  }
  
  // Si l'utilisateur est authentifié mais n'a pas le rôle requis, rediriger vers la page appropriée
  if (user && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute - Utilisateur authentifié mais sans les droits requis');
    return user.role === 'admin' 
      ? <Navigate to="/dashboard" /> 
      : <Navigate to="/employee-dashboard" />;
  }
  
  // Si l'utilisateur est authentifié et a le rôle requis, afficher les enfants
  console.log('ProtectedRoute - Utilisateur authentifié avec les droits requis, affichage du contenu protégé');
  return <>{children}</>;
};

export default ProtectedRoute; 