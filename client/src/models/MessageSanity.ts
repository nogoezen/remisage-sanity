import { sanityClient, extractId } from '../config/sanity';
import { Message } from './interfaces';
import { SanityMessage } from './sanityInterfaces';

export class MessageModel {
  static async findById(id: string): Promise<SanityMessage | null> {
    try {
      const message = await sanityClient.fetch(
        `*[_type == "message" && _id == $id][0]`,
        { id: `message-${id}` }
      );
      return message ? this.transformSanityMessage(message) : null;
    } catch (error) {
      console.error('Error finding message by ID:', error);
      return null;
    }
  }

  static async create(messageData: Omit<Message, 'id' | 'createdAt'>): Promise<SanityMessage> {
    try {
      const messageDoc = {
        _type: 'message',
        sender: {
          _type: 'reference',
          _ref: `user-${messageData.senderId}`
        },
        receiver: {
          _type: 'reference',
          _ref: `user-${messageData.receiverId}`
        },
        subject: messageData.subject,
        content: messageData.content,
        isRead: messageData.isRead || false,
        isArchived: messageData.isArchived || false
      };

      const newMessage = await sanityClient.create(messageDoc);
      return this.transformSanityMessage(newMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  static async update(id: string, messageData: Partial<Message>): Promise<boolean> {
    try {
      const updateData: any = { ...messageData };
      
      // Traiter les références aux utilisateurs si nécessaire
      if (updateData.senderId) {
        updateData.sender = {
          _type: 'reference',
          _ref: `user-${updateData.senderId}`
        };
        delete updateData.senderId;
      }
      
      if (updateData.receiverId) {
        updateData.receiver = {
          _type: 'reference',
          _ref: `user-${updateData.receiverId}`
        };
        delete updateData.receiverId;
      }

      const result = await sanityClient.patch(`message-${id}`)
        .set(updateData)
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error updating message:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await sanityClient.delete(`message-${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  static async findBySender(senderId: string): Promise<SanityMessage[]> {
    try {
      const messages = await sanityClient.fetch(
        `*[_type == "message" && sender._ref == $senderId] | order(_createdAt desc)`,
        { senderId: `user-${senderId}` }
      );
      return messages.map(this.transformSanityMessage);
    } catch (error) {
      console.error('Error finding messages by sender:', error);
      return [];
    }
  }

  static async findByReceiver(receiverId: string): Promise<SanityMessage[]> {
    try {
      const messages = await sanityClient.fetch(
        `*[_type == "message" && receiver._ref == $receiverId] | order(_createdAt desc)`,
        { receiverId: `user-${receiverId}` }
      );
      return messages.map(this.transformSanityMessage);
    } catch (error) {
      console.error('Error finding messages by receiver:', error);
      return [];
    }
  }

  static async findByUser(userId: string): Promise<SanityMessage[]> {
    try {
      const messages = await sanityClient.fetch(
        `*[_type == "message" && (sender._ref == $userId || receiver._ref == $userId)] | order(_createdAt desc)`,
        { userId: `user-${userId}` }
      );
      return messages.map(this.transformSanityMessage);
    } catch (error) {
      console.error('Error finding messages by user:', error);
      return [];
    }
  }

  static async markAsRead(id: string): Promise<boolean> {
    try {
      const result = await sanityClient.patch(`message-${id}`)
        .set({ isRead: true })
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  static async markAsUnread(id: string): Promise<boolean> {
    try {
      const result = await sanityClient.patch(`message-${id}`)
        .set({ isRead: false })
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error marking message as unread:', error);
      return false;
    }
  }

  static async archive(id: string): Promise<boolean> {
    try {
      const result = await sanityClient.patch(`message-${id}`)
        .set({ isArchived: true })
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error archiving message:', error);
      return false;
    }
  }

  static async unarchive(id: string): Promise<boolean> {
    try {
      const result = await sanityClient.patch(`message-${id}`)
        .set({ isArchived: false })
        .commit();
      
      return !!result;
    } catch (error) {
      console.error('Error unarchiving message:', error);
      return false;
    }
  }

  static async countUnread(userId: string): Promise<number> {
    try {
      const result = await sanityClient.fetch(
        `count(*[_type == "message" && receiver._ref == $userId && isRead == false])`,
        { userId: `user-${userId}` }
      );
      return result;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
  }

  // Méthode de transformation pour convertir les documents Sanity en objets du modèle
  private static transformSanityMessage(sanityMessage: any): SanityMessage {
    return {
      id: extractId(sanityMessage._id),
      senderId: extractId(sanityMessage.sender._ref),
      receiverId: extractId(sanityMessage.receiver._ref),
      subject: sanityMessage.subject,
      content: sanityMessage.content,
      isRead: sanityMessage.isRead,
      isArchived: sanityMessage.isArchived,
      createdAt: new Date(sanityMessage._createdAt)
    };
  }
} 