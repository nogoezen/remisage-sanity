import { FastifyReply } from 'fastify';

/**
 * Types d'erreurs personnalisées
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST'
}

/**
 * Classe d'erreur personnalisée
 */
export class AppError extends Error {
  statusCode: number;
  type: ErrorType;
  details?: any;

  constructor(message: string, statusCode: number, type: ErrorType, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(message, 400, ErrorType.BAD_REQUEST, details);
  }

  static validation(message: string, details?: any): AppError {
    return new AppError(message, 400, ErrorType.VALIDATION, details);
  }

  static notFound(message: string, details?: any): AppError {
    return new AppError(message, 404, ErrorType.NOT_FOUND, details);
  }

  static unauthorized(message: string, details?: any): AppError {
    return new AppError(message, 401, ErrorType.UNAUTHORIZED, details);
  }

  static forbidden(message: string, details?: any): AppError {
    return new AppError(message, 403, ErrorType.FORBIDDEN, details);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(message, 409, ErrorType.CONFLICT, details);
  }

  static internal(message: string, details?: any): AppError {
    return new AppError(message, 500, ErrorType.INTERNAL, details);
  }
}

/**
 * Gestionnaire d'erreurs centralisé
 * @param error Erreur à gérer
 * @param reply Réponse Fastify
 */
export const handleError = (error: Error, reply: FastifyReply): FastifyReply => {
  // Vérifier si c'est une erreur personnalisée
  if (error instanceof AppError) {
    const { statusCode, message, type, details } = error;
    
    // En mode production, ne pas renvoyer les détails pour les erreurs 500
    const responseDetails = statusCode === 500 && process.env.NODE_ENV === 'production'
      ? undefined
      : details;
    
    return reply.status(statusCode).send({
      error: {
        type,
        message,
        details: responseDetails
      }
    });
  }
  
  // Erreur non gérée
  console.error('Erreur non gérée:', error);
  
  // En production, ne pas renvoyer le message d'erreur original
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue'
    : error.message;
  
  return reply.status(500).send({
    error: {
      type: ErrorType.INTERNAL,
      message: errorMessage
    }
  });
}; 