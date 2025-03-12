import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import api from '../services/api';

// Définition du type User
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
}

// Interface pour les données d'enregistrement
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Interface pour les données de mise à jour du profil
interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Création du contexte avec des valeurs par défaut
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  updateProfile: async () => {}
});

// Provider du contexte d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Configurer l'en-tête d'autorisation pour les requêtes axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    }
  }, [token]);

  // Charger le profil utilisateur au démarrage si un token existe
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        console.log('Chargement du profil utilisateur avec le token existant');
        
        const response = await api.get('/users/profile');
        console.log('Profil utilisateur récupéré:', response.data);
        
        let userData;
        if (response.data.user) {
          userData = response.data.user;
        } else {
          userData = response.data;
        }
        
        // Vérification explicite du rôle
        if (userData && userData.email && userData.role) {
          console.log('Rôle détecté:', userData.role);
          
          // Forcer le rôle admin pour admin@remisage.com
          if (userData.email === 'admin@remisage.com' && userData.role !== 'admin') {
            console.warn('Correction du rôle: l\'utilisateur admin@remisage.com devrait avoir le rôle admin');
            userData.role = 'admin';
          }
        } else {
          console.error('Aucun rôle ou email détecté dans les données utilisateur');
        }
        
        setUser(userData);
        
        // Log du rôle de l'utilisateur
        logger.role('AuthContext', userData, [
          userData.role === 'admin' 
            ? 'Accès complet au système' 
            : 'Accès limité aux fonctionnalités employé'
        ]);
        
        setLoading(false);
      } catch (err) {
        logger.error('AuthContext', 'Erreur lors de la récupération du profil:', err);
        console.error('Erreur lors de la récupération du profil, mais on maintient l\'authentification');
        // Ne pas déconnecter l'utilisateur en cas d'erreur temporaire
        // Cela pourrait être dû à un problème réseau temporaire
        setError('Impossible de récupérer votre profil, mais vous restez connecté.');
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [token]);

  // Connexion
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Tentative de connexion avec:', { email, password: '********' });
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Réponse brute du serveur:', response.data);
      
      // Extraire les données utilisateur et le token
      let userData;
      let newToken;
      
      if (response.data.user && response.data.token) {
        // Format attendu: { user: {...}, token: '...' }
        userData = response.data.user;
        newToken = response.data.token;
      } else if (response.data.token) {
        // Ancien format possible: { token: '...', ...userData }
        const { token, ...rest } = response.data;
        userData = rest;
        newToken = token;
      } else {
        throw new Error('Format de réponse invalide');
      }
      
      console.log('Données utilisateur extraites:', userData);
      
      // Vérification explicite du rôle
      if (userData && userData.email && userData.role) {
        console.log('Rôle détecté:', userData.role);
        
        // Forcer le rôle admin pour admin@remisage.com
        if (email === 'admin@remisage.com' && userData.role !== 'admin') {
          console.warn('Correction du rôle: l\'utilisateur admin@remisage.com devrait avoir le rôle admin');
          userData.role = 'admin';
        }
        
        // Assurer que le rôle est soit 'admin' soit 'employee'
        if (userData.role !== 'admin' && userData.role !== 'employee') {
          console.warn(`Rôle non reconnu: ${userData.role}, définition par défaut à 'employee'`);
          userData.role = 'employee';
        }
      } else {
        console.error('Aucun rôle ou email détecté dans les données utilisateur');
        // Définir un rôle par défaut
        userData.role = 'employee';
      }
      
      // Log du rôle de l'utilisateur
      logger.role('AuthContext', userData, [
        userData.role === 'admin' 
          ? 'Accès complet au système' 
          : 'Accès limité aux fonctionnalités employé'
      ]);
      
      // Définir l'utilisateur et le token
      setUser(userData);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setIsAuthenticated(true); // Définir explicitement comme authentifié
      setLoading(false);
    } catch (err: any) {
      logger.error('AuthContext', 'Erreur de connexion:', err);
      setError(err.response?.data?.error || 'Erreur de connexion');
      setLoading(false);
      throw err;
    }
  };

  // Inscription
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { token: newToken, ...newUserData } = response.data;
      
      // Log du rôle de l'utilisateur
      logger.role('AuthContext', newUserData, [
        newUserData.role === 'admin' 
          ? 'Accès complet au système' 
          : 'Accès limité aux fonctionnalités employé'
      ]);
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUserData);
      setLoading(false);
    } catch (err: any) {
      logger.error('AuthContext', 'Erreur lors de l\'inscription:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
      setLoading(false);
      throw err;
    }
  };

  // Mise à jour du profil
  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      setLoading(true);
      setError(null);
      logger.info('AuthContext', 'Mise à jour du profil utilisateur');
      console.log('Données de mise à jour du profil:', profileData);
      
      console.log(`Envoi de la requête PUT à ${API_URL}/users/profile`);
      const response = await api.put('/users/profile', profileData);
      console.log('Réponse de mise à jour du profil:', response.data);
      
      let updatedUserData: Partial<User> = {};
      if (response.data.user) {
        updatedUserData = response.data.user;
        console.log('Données utilisateur extraites de response.data.user:', updatedUserData);
      } else {
        updatedUserData = response.data;
        console.log('Données utilisateur extraites de response.data:', updatedUserData);
      }
      
      logger.info('AuthContext', 'Profil utilisateur mis à jour avec succès');
      
      // Mettre à jour l'utilisateur dans le contexte
      setUser(prevUser => {
        const newUser = {
          ...prevUser!,
          ...updatedUserData
        };
        console.log('Nouvel état utilisateur après mise à jour:', newUser);
        return newUser;
      });
      
      setLoading(false);
      return response.data;
    } catch (err: any) {
      console.error('Erreur complète lors de la mise à jour du profil:', err);
      logger.error('AuthContext', 'Erreur lors de la mise à jour du profil:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de la mise à jour du profil';
      console.error('Message d\'erreur:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Déconnexion
  const logout = () => {
    if (user) {
      logger.info('AuthContext', `Déconnexion de l'utilisateur: ${user.firstName} ${user.lastName}`);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      isAuthenticated,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 