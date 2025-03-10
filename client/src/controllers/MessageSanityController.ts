import { FastifyRequest, FastifyReply } from 'fastify';
import { MessageModel } from '../models/MessageSanity';
import { UserModel } from '../models/UserSanity';

export class MessageSanityController {
  static async sendMessage(request: FastifyRequest<{
    Body: {
      receiverId: string;
      subject: string;
      content: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { receiverId, subject, content } = request.body;
      const senderId = request.user.id;

      // Vérifier si le destinataire existe
      const receiver = await UserModel.findById(receiverId);
      if (!receiver) {
        return reply.status(404).send({ error: 'Destinataire non trouvé' });
      }

      // Créer le message
      const message = await MessageModel.create({
        senderId,
        receiverId,
        subject,
        content,
        isRead: false,
        isArchived: false
      });

      return reply.status(201).send({ message });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de l\'envoi du message' });
    }
  }

  static async getMessage(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer le message
      const message = await MessageModel.findById(id);
      if (!message) {
        return reply.status(404).send({ error: 'Message non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à voir ce message
      if (message.senderId !== userId && message.receiverId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Marquer le message comme lu si l'utilisateur est le destinataire
      if (message.receiverId === userId && !message.isRead) {
        await MessageModel.markAsRead(id);
        message.isRead = true;
      }

      return reply.send({ message });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération du message' });
    }
  }

  static async getUserMessages(request: FastifyRequest<{
    Querystring: {
      type?: 'sent' | 'received' | 'all';
      archived?: 'true' | 'false';
    };
  }>, reply: FastifyReply) {
    try {
      const { type = 'all', archived = 'false' } = request.query;
      const userId = request.user.id;
      const isArchived = archived === 'true';

      let messages;

      // Récupérer les messages selon le type
      if (type === 'sent') {
        messages = await MessageModel.findBySender(userId);
      } else if (type === 'received') {
        messages = await MessageModel.findByReceiver(userId);
      } else {
        messages = await MessageModel.findByUser(userId);
      }

      // Filtrer les messages archivés/non archivés
      messages = messages.filter(message => message.isArchived === isArchived);

      return reply.send({ messages });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la récupération des messages' });
    }
  }

  static async updateMessage(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      subject?: string;
      content?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { subject, content } = request.body;
      const userId = request.user.id;

      // Récupérer le message
      const message = await MessageModel.findById(id);
      if (!message) {
        return reply.status(404).send({ error: 'Message non trouvé' });
      }

      // Vérifier si l'utilisateur est l'expéditeur du message
      if (message.senderId !== userId) {
        return reply.status(403).send({ error: 'Vous n\'êtes pas autorisé à modifier ce message' });
      }

      // Mettre à jour le message
      const success = await MessageModel.update(id, { subject, content });
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la mise à jour du message' });
      }

      // Récupérer le message mis à jour
      const updatedMessage = await MessageModel.findById(id);
      return reply.send({ message: updatedMessage });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du message' });
    }
  }

  static async archiveMessage(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer le message
      const message = await MessageModel.findById(id);
      if (!message) {
        return reply.status(404).send({ error: 'Message non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à archiver ce message
      if (message.senderId !== userId && message.receiverId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Archiver le message
      const success = await MessageModel.archive(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de l\'archivage du message' });
      }

      return reply.send({ message: 'Message archivé avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de l\'archivage du message' });
    }
  }

  static async unarchiveMessage(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer le message
      const message = await MessageModel.findById(id);
      if (!message) {
        return reply.status(404).send({ error: 'Message non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à désarchiver ce message
      if (message.senderId !== userId && message.receiverId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Désarchiver le message
      const success = await MessageModel.unarchive(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la désarchivage du message' });
      }

      return reply.send({ message: 'Message désarchivé avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la désarchivage du message' });
    }
  }

  static async deleteMessage(request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Récupérer le message
      const message = await MessageModel.findById(id);
      if (!message) {
        return reply.status(404).send({ error: 'Message non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à supprimer ce message
      if (message.senderId !== userId && message.receiverId !== userId) {
        return reply.status(403).send({ error: 'Accès non autorisé' });
      }

      // Supprimer le message
      const success = await MessageModel.delete(id);
      if (!success) {
        return reply.status(500).send({ error: 'Erreur lors de la suppression du message' });
      }

      return reply.send({ message: 'Message supprimé avec succès' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors de la suppression du message' });
    }
  }

  static async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Compter les messages non lus
      const count = await MessageModel.countUnread(userId);

      return reply.send({ count });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur lors du comptage des messages non lus' });
    }
  }
} 