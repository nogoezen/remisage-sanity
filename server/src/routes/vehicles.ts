import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Define route parameter types
interface VehicleParams {
  Params: {
    id: string;
  };
}

interface CreateVehicleBody {
  Body: {
    model: string;
    licensePlate: string;
    status: string;
    location?: string;
    assignedTo?: number;
  };
}

interface UpdateVehicleBody {
  Body: {
    model?: string;
    licensePlate?: string;
    status?: string;
    location?: string;
    assignedTo?: number;
  };
  Params: {
    id: string;
  };
}

export default async function (fastify: FastifyInstance) {
  // Get all vehicles
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // @ts-ignore - db is added by the plugin
        const vehicles = await fastify.db.query(`
          SELECT v.*, u.firstName, u.lastName 
          FROM vehicles v
          LEFT JOIN users u ON v.assignedTo = u.id
        `);
        return vehicles;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get vehicle by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<VehicleParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const [vehicle] = await fastify.db.query(`
          SELECT v.*, u.firstName, u.lastName 
          FROM vehicles v
          LEFT JOIN users u ON v.assignedTo = u.id
          WHERE v.id = ?
        `, [id]);

        if (!vehicle) {
          return reply.code(404).send({ error: 'Vehicle not found' });
        }

        return vehicle;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get vehicles assigned to a user
  fastify.get('/user/:userId', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const vehicles = await fastify.db.query(`
          SELECT v.* 
          FROM vehicles v
          WHERE v.assignedTo = ?
        `, [userId]);

        return vehicles;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Create a new vehicle
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<CreateVehicleBody>, reply: FastifyReply) => {
      try {
        const { model, licensePlate, status, location, assignedTo } = request.body;
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'INSERT INTO vehicles (model, licensePlate, status, location, assignedTo) VALUES (?, ?, ?, ?, ?)',
          [model, licensePlate, status, location || null, assignedTo || null]
        );
        
        // @ts-ignore - insertId is available on the result
        const vehicleId = result.insertId;
        
        return { 
          id: vehicleId,
          model,
          licensePlate,
          status,
          location,
          assignedTo
        };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Update a vehicle
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<UpdateVehicleBody>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updates = request.body;
        
        // Build update query
        const fields = Object.keys(updates);
        if (fields.length === 0) {
          return reply.code(400).send({ error: 'No fields to update' });
        }
        
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          `UPDATE vehicles SET ${setClause} WHERE id = ?`,
          values
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'Vehicle not found' });
        }
        
        return { success: true, message: 'Vehicle updated successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Delete a vehicle
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<VehicleParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'DELETE FROM vehicles WHERE id = ?',
          [id]
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'Vehicle not found' });
        }
        
        return { success: true, message: 'Vehicle deleted successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Assign vehicle to user
  fastify.post('/:id/assign', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Params: { id: string }, Body: { userId: number } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { userId } = request.body;
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'UPDATE vehicles SET assignedTo = ? WHERE id = ?',
          [userId, id]
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'Vehicle not found' });
        }
        
        return { success: true, message: 'Vehicle assigned successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Update vehicle location
  fastify.post('/:id/location', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ 
      Params: { id: string }, 
      Body: { 
        address: string,
        latitude: number,
        longitude: number
      } 
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { address, latitude, longitude } = request.body;
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'UPDATE vehicles SET address = ?, latitude = ?, longitude = ? WHERE id = ?',
          [address, latitude, longitude, id]
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'Vehicle not found' });
        }
        
        // Add to location history
        // @ts-ignore - db is added by the plugin
        await fastify.db.execute(
          'INSERT INTO vehicle_location_history (vehicleId, address, latitude, longitude, updatedBy) VALUES (?, ?, ?, ?, ?)',
          [id, address, latitude, longitude, request.user.id]
        );
        
        // Récupérer le véhicule mis à jour
        // @ts-ignore - db is added by the plugin
        const [rows] = await fastify.db.query(
          'SELECT * FROM vehicles WHERE id = ?',
          [id]
        );
        
        return rows[0];
      } catch (error) {
        console.error('Error updating vehicle location:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get vehicle location history
  fastify.get('/:id/location-history', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<VehicleParams>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const history = await fastify.db.query(`
          SELECT vlh.*, u.firstName, u.lastName 
          FROM vehicle_location_history vlh
          LEFT JOIN users u ON vlh.updatedBy = u.id
          WHERE vlh.vehicleId = ?
          ORDER BY vlh.createdAt DESC
        `, [id]);

        return history;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });
} 