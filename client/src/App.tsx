import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { frFR } from '@mui/material/locale';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import EmergencyButton from './components/EmergencyButton';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const VehicleManagement = lazy(() => import('./pages/VehicleManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Définition du thème
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
}, frFR);

// Composant pour rediriger en fonction du rôle
const RoleBasedRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Si le chargement est en cours, afficher un indicateur de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }
  
  // Rediriger en fonction du rôle
  console.log('Redirection basée sur le rôle:', user.role);
  return user.role === 'admin' 
    ? <Navigate to="/dashboard" /> 
    : <Navigate to="/employee-dashboard" />;
};

// Composant pour protéger les routes
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
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

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Numéro d'urgence (pourrait être chargé depuis une configuration)
  const emergencyNumber = '112';
  
  // Fonction appelée lorsque l'utilisateur utilise le bouton d'urgence
  const handleEmergencyCall = () => {
    console.log('Appel d\'urgence déclenché');
    // Ici, on pourrait enregistrer l'événement ou envoyer une notification
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                <Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                }>
                  <Routes>
                    <Route path="/" element={<RoleBasedRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-dashboard" element={
                      <ProtectedRoute allowedRoles={['employee']}>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/vehicles" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <VehicleManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute allowedRoles={['admin', 'employee']}>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Container>
              <Footer />
              
              {/* Afficher le bouton d'urgence uniquement si l'utilisateur est connecté */}
              {isAuthenticated && (
                <EmergencyButton 
                  phoneNumber={emergencyNumber} 
                  onCall={handleEmergencyCall} 
                />
              )}
            </Box>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App; 