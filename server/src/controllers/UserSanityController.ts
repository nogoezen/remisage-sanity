import { FastifyRequest, FastifyReply } from 'fastify';
import { generateToken } from '../utils/auth';
import { UserModel } from '../models/UserSanity';

// Interface pour étendre la déclaration de Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
      has_vehicle_assigned?: boolean;
    }
  }
}

export class UserSanityController {
  static async register(request: FastifyRequest<{
    Body: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role?: 'admin' | 'employee';
      has_vehicle_assigned?: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      const { firstName, lastName, email, password, role = 'employee', has_vehicle_assigned = true } = request.body;

      // Vérifier si l'email existe déjà
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return reply.status(400).send({ error: 'Cet email est déjà utilisé' });
      }

      // Créer l'utilisateur
      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        role,
        has_vehicle_assigned
      });

      // Générer le token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        has_vehicle_assigned: user.has_vehicle_assigned
      });

      return reply.status(201).send({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          has_vehicle_assigned: user.has_vehicle_assigned
        },
        token
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
  }

  static async login(request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { email, password } = request.body;

      // Authentifier l'utilisateur
      const user = await UserModel.authenticate(email, password);
      if (!user) {
        return reply.status(401).send({ error: 'Email ou mot de passe incorrect' });
      }

      // Générer le token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        has_vehicle_assigned: user.has_vehicle_assigned
      });

      return reply.send({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          has_vehicle_assigned: user.has_vehicle_assigned
        },
        token
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la connexion' });
    }
  }

  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Récupérer l'utilisateur avec ses relations
      const user = await UserModel.findWithRelations(userId);
      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' });
      }

      return reply.send({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          has_vehicle_assigned: user.has_vehicle_assigned,
          vehicles: user.vehicles,
          messages: user.messages,
          requests: user.requests,
          notifications: user.notifications
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération du profil' });
    }
  }

  static async updateProfile(request: FastifyRequest<{
    Body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const { firstName, lastName, email, currentPassword, newPassword } = request.body;

      // Récupérer l'utilisateur
      const user = await UserModel.findById(userId);
      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier si l'email existe déjà (si l'email est modifié)
      if (email && email !== user.email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          return reply.status(400).send({ error: 'Cet email est déjà utilisé' });
        }
      }

      // Préparer les données à mettre à jour
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;

      // Mettre à jour le mot de passe si nécessaire
      if (currentPassword && newPassword) {
        // Vérifier le mot de passe actuel
        const isValid = await UserModel.authenticate(user.email, currentPassword);
        if (!isValid) {
          return reply.status(400).send({ error: 'Mot de passe actuel incorrect' });
        }
        updateData.password = newPassword;
      }

      // Mettre à jour l'utilisateur
      const success = await UserModel.update(userId, updateData);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la mise à jour du profil' });
      }

      // Récupérer l'utilisateur mis à jour
      const updatedUser = await UserModel.findById(userId);
      if (!updatedUser) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé après mise à jour' });
      }

      return reply.send({
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          has_vehicle_assigned: updatedUser.has_vehicle_assigned
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du profil' });
    }
  }

  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Récupérer tous les utilisateurs
      const users = await UserModel.findAll();

      // Formater les données
      const formattedUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        has_vehicle_assigned: user.has_vehicle_assigned
      }));

      return reply.send({ users: formattedUsers });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }

  static async deleteUser(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Supprimer l'utilisateur
      const success = await UserModel.delete(id);
      if (!success) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' });
      }

      return reply.send({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  }

  static async updateVehicleAssignmentStatus(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      has_vehicle_assigned: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { has_vehicle_assigned } = request.body;

      // Vérifier si l'utilisateur est un administrateur
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Mettre à jour le statut d'assignation de véhicule
      const success = await UserModel.update(id, { has_vehicle_assigned });
      if (!success) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' });
      }

      return reply.send({ message: 'Statut d\'assignation de véhicule mis à jour avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du statut d\'assignation de véhicule' });
    }
  }
} 