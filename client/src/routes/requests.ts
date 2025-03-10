import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Define route parameter types
interface RequestParams {
  Params: {
    id: string;
  };
}

interface CreateRequestBody {
  Body: {
    userId: number;
    type: string;
    details: string;
    vehicleId?: number;
    requestedDate?: string;
  };
}

interface UpdateRequestBody {
  Body: {
    status?: string;
    adminResponse?: string;
    resolvedBy?: number;
  };
  Params: {
    id: string;
  };
}

export default async function (fastify: FastifyInstance) {
  // Get all requests (admin only)
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Verify admin role
        if (request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Admin access required' });
        }
        
        // @ts-ignore - db is added by the plugin
        const requests = await fastify.db.query(`
          SELECT r.*, 
            u.firstName as userFirstName, 
            u.lastName as userLastName,
            v.model as vehicleModel,
            v.licensePlate as vehicleLicensePlate,
            admin.firstName as adminFirstName,
            admin.lastName as adminLastName
          FROM requests r
          JOIN users u ON r.userId = u.id
          LEFT JOIN vehicles v ON r.vehicleId = v.id
          LEFT JOIN users admin ON r.resolvedBy = admin.id
          ORDER BY r.createdAt DESC
        `);

        return requests;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get requests for a specific user
  fastify.get('/user/:userId', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        // Verify that the user is requesting their own data or is an admin
        if (request.user.id !== parseInt(userId) && request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Access denied' });
        }
        
        // @ts-ignore - db is added by the plugin
        const requests = await fastify.db.query(`
          SELECT r.*, 
            v.model as vehicleModel,
            v.licensePlate as vehicleLicensePlate,
            admin.firstName as adminFirstName,
            admin.lastName as adminLastName
          FROM requests r
          LEFT JOIN vehicles v ON r.vehicleId = v.id
          LEFT JOIN users admin ON r.resolvedBy = admin.id
          WHERE r.userId = ?
          ORDER BY r.createdAt DESC
        `, [userId]);

        return requests;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get a specific request
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<RequestParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const [req] = await fastify.db.query(`
          SELECT r.*, 
            u.firstName as userFirstName, 
            u.lastName as userLastName,
            v.model as vehicleModel,
            v.licensePlate as vehicleLicensePlate,
            admin.firstName as adminFirstName,
            admin.lastName as adminLastName
          FROM requests r
          JOIN users u ON r.userId = u.id
          LEFT JOIN vehicles v ON r.vehicleId = v.id
          LEFT JOIN users admin ON r.resolvedBy = admin.id
          WHERE r.id = ?
        `, [id]);

        if (!req) {
          return reply.code(404).send({ error: 'Request not found' });
        }

        // Verify that the user is the owner of the request or an admin
        if (req.userId !== request.user.id && request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Access denied' });
        }

        return req;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Create a new request
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<CreateRequestBody>, reply: FastifyReply) => {
      try {
        const { userId, type, details, vehicleId, requestedDate } = request.body;
        
        // Verify that the user is creating a request for themselves
        if (userId !== request.user.id) {
          return reply.code(403).send({ error: 'You can only create requests for yourself' });
        }
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'INSERT INTO requests (userId, type, details, vehicleId, requestedDate, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, type, details, vehicleId || null, requestedDate || null, 'pending']
        );
        
        // @ts-ignore - insertId is available on the result
        const requestId = result.insertId;
        
        return { 
          id: requestId,
          userId,
          type,
          details,
          vehicleId,
          requestedDate,
          status: 'pending',
          createdAt: new Date()
        };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Update a request (admin only)
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<UpdateRequestBody>, reply: FastifyReply) => {
      try {
        // Verify admin role
        if (request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Admin access required' });
        }
        
        const { id } = request.params;
        const { status, adminResponse, resolvedBy } = request.body;
        
        // Verify that the request exists
        // @ts-ignore - db is added by the plugin
        const [existingRequest] = await fastify.db.query(
          'SELECT * FROM requests WHERE id = ?',
          [id]
        );
        
        if (!existingRequest) {
          return reply.code(404).send({ error: 'Request not found' });
        }
        
        // Build update query
        const updates: any = {};
        if (status !== undefined) updates.status = status;
        if (adminResponse !== undefined) updates.adminResponse = adminResponse;
        if (resolvedBy !== undefined) updates.resolvedBy = resolvedBy;
        
        if (Object.keys(updates).length === 0) {
          return reply.code(400).send({ error: 'No fields to update' });
        }
        
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          `UPDATE requests SET ${setClause} WHERE id = ?`,
          values
        );
        
        return { success: true, message: 'Request updated successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Delete a request
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<RequestParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Verify that the request exists and belongs to the user
        // @ts-ignore - db is added by the plugin
        const [existingRequest] = await fastify.db.query(
          'SELECT * FROM requests WHERE id = ?',
          [id]
        );
        
        if (!existingRequest) {
          return reply.code(404).send({ error: 'Request not found' });
        }
        
        // Only the owner or an admin can delete a request
        if (existingRequest.userId !== request.user.id && request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Access denied' });
        }
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'DELETE FROM requests WHERE id = ?',
          [id]
        );
        
        return { success: true, message: 'Request deleted successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });
} 