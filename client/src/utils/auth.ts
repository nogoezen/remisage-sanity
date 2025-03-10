import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Interface pour les données utilisateur dans le token
interface TokenUser {
  id: string | number;
  email: string;
  role: string;
  has_vehicle_assigned?: boolean;
}

export const generateToken = (user: TokenUser): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      has_vehicle_assigned: user.has_vehicle_assigned
    },
    secret,
    { expiresIn: '24h' }
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
}; 