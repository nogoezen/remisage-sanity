import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Define route parameter types
interface MessageParams {
  Params: {
    id: string;
  };
}

interface CreateMessageBody {
  Body: {
    senderId: number;
    receiverId: number;
    subject: string;
    content: string;
  };
}

interface UpdateMessageBody {
  Body: {
    isRead?: boolean;
    isArchived?: boolean;
  };
  Params: {
    id: string;
  };
}

export default async function (fastify: FastifyInstance) {
  // Get all messages for a user
  fastify.get('/user/:userId', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const messages = await fastify.db.query(`
          SELECT m.*, 
            sender.firstName as senderFirstName, 
            sender.lastName as senderLastName,
            receiver.firstName as receiverFirstName, 
            receiver.lastName as receiverLastName
          FROM messages m
          JOIN users sender ON m.senderId = sender.id
          JOIN users receiver ON m.receiverId = receiver.id
          WHERE m.receiverId = ? OR m.senderId = ?
          ORDER BY m.createdAt DESC
        `, [userId, userId]);

        return messages;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get unread messages count for a user
  fastify.get('/user/:userId/unread', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const [result] = await fastify.db.query(`
          SELECT COUNT(*) as unreadCount
          FROM messages
          WHERE receiverId = ? AND isRead = 0
        `, [userId]);

        return { unreadCount: result.unreadCount };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get a specific message
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<MessageParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const [message] = await fastify.db.query(`
          SELECT m.*, 
            sender.firstName as senderFirstName, 
            sender.lastName as senderLastName,
            receiver.firstName as receiverFirstName, 
            receiver.lastName as receiverLastName
          FROM messages m
          JOIN users sender ON m.senderId = sender.id
          JOIN users receiver ON m.receiverId = receiver.id
          WHERE m.id = ?
        `, [id]);

        if (!message) {
          return reply.code(404).send({ error: 'Message not found' });
        }

        // Mark as read if the current user is the receiver
        if (message.receiverId === request.user.id && !message.isRead) {
          // @ts-ignore - db is added by the plugin
          await fastify.db.execute(
            'UPDATE messages SET isRead = 1 WHERE id = ?',
            [id]
          );
          message.isRead = true;
        }

        return message;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Send a new message
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<CreateMessageBody>, reply: FastifyReply) => {
      try {
        const { senderId, receiverId, subject, content } = request.body;
        
        // Verify that the sender is the current user
        if (senderId !== request.user.id) {
          return reply.code(403).send({ error: 'You can only send messages as yourself' });
        }
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'INSERT INTO messages (senderId, receiverId, subject, content) VALUES (?, ?, ?, ?)',
          [senderId, receiverId, subject, content]
        );
        
        // @ts-ignore - insertId is available on the result
        const messageId = result.insertId;
        
        return { 
          id: messageId,
          senderId,
          receiverId,
          subject,
          content,
          isRead: false,
          isArchived: false,
          createdAt: new Date()
        };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Update a message (mark as read/archived)
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<UpdateMessageBody>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { isRead, isArchived } = request.body;
        
        // Verify that the message belongs to the current user
        // @ts-ignore - db is added by the plugin
        const [message] = await fastify.db.query(
          'SELECT * FROM messages WHERE id = ?',
          [id]
        );
        
        if (!message) {
          return reply.code(404).send({ error: 'Message not found' });
        }
        
        if (message.receiverId !== request.user.id) {
          return reply.code(403).send({ error: 'You can only update messages sent to you' });
        }
        
        // Build update query
        const updates: any = {};
        if (isRead !== undefined) updates.isRead = isRead;
        if (isArchived !== undefined) updates.isArchived = isArchived;
        
        if (Object.keys(updates).length === 0) {
          return reply.code(400).send({ error: 'No fields to update' });
        }
        
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          `UPDATE messages SET ${setClause} WHERE id = ?`,
          values
        );
        
        return { success: true, message: 'Message updated successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Delete a message
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<MessageParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Verify that the message belongs to the current user
        // @ts-ignore - db is added by the plugin
        const [message] = await fastify.db.query(
          'SELECT * FROM messages WHERE id = ?',
          [id]
        );
        
        if (!message) {
          return reply.code(404).send({ error: 'Message not found' });
        }
        
        if (message.senderId !== request.user.id && message.receiverId !== request.user.id) {
          return reply.code(403).send({ error: 'You can only delete your own messages' });
        }
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'DELETE FROM messages WHERE id = ?',
          [id]
        );
        
        return { success: true, message: 'Message deleted successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });
} 