/**
 * Utilitaire de journalisation pour l'application
 * Permet de centraliser les logs et de les formater de manière cohérente
 */

// Types de logs
type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'role';

// Couleurs pour les différents types de logs
const LOG_COLORS = {
  info: '#2196F3',   // Bleu
  warn: '#FF9800',   // Orange
  error: '#F44336', // Rouge
  debug: '#9C27B0', // Violet
  role: '#4CAF50'   // Vert
};

// Fonction pour formater la date
const formatDate = (): string => {
  const now = new Date();
  return now.toLocaleTimeString();
};

// Fonction principale de log
export const log = (level: LogLevel, module: string, message: string, data?: any): void => {
  const timestamp = formatDate();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
  
  // Appliquer des styles différents selon le niveau de log
  const style = `color: ${LOG_COLORS[level]}; font-weight: bold`;
  
  if (data) {
    console.log(`%c${prefix} ${message}`, style, data);
  } else {
    console.log(`%c${prefix} ${message}`, style);
  }
};

// Fonctions spécifiques pour chaque niveau de log
export const logInfo = (module: string, message: string, data?: any): void => {
  log('info', module, message, data);
};

export const logWarn = (module: string, message: string, data?: any): void => {
  log('warn', module, message, data);
};

export const logError = (module: string, message: string, data?: any): void => {
  log('error', module, message, data);
};

export const logDebug = (module: string, message: string, data?: any): void => {
  log('debug', module, message, data);
};

// Fonction spécifique pour les logs liés aux rôles
export const logRole = (module: string, user: { firstName: string, lastName: string, role: string }, actions?: string[]): void => {
  log('role', module, `Utilisateur: ${user.firstName} ${user.lastName}`);
  log('role', module, `Rôle: ${user.role === 'admin' ? 'Administrateur' : 'Employé'}`);
  
  if (actions && actions.length > 0) {
    log('role', module, 'Actions disponibles:');
    actions.forEach(action => {
      log('role', module, `- ${action}`);
    });
  }
};

export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
  role: logRole
}; 