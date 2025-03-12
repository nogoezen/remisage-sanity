import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { compare, hash } from 'bcrypt';

// Define route parameter types
interface LoginRequest {
  Body: {
    email: string;
    password: string;
  };
}

interface RegisterRequest {
  Body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
  };
}

interface UpdateRequest {
  Params: {
    id: string;
  };
  Body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
  };
}

interface GetUserRequest {
  Params: {
    id: string;
  };
}

export default async function (fastify: FastifyInstance) {
  // Get all users (admin only)
  fastify.get('/', {
    onRequest: [fastify.requireAdmin],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // @ts-ignore - db is added by the plugin
        const users = await fastify.db.query(
          'SELECT id, firstName, lastName, email, role, createdAt FROM users'
        );
        return users;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get current user profile
  fastify.get('/profile', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        
        // @ts-ignore - db is added by the plugin
        const [user] = await fastify.db.query(
          'SELECT id, firstName, lastName, email, role, createdAt FROM users WHERE id = ?',
          [userId]
        );

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return user;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Get user by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<GetUserRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const [user] = await fastify.db.query(
          'SELECT id, firstName, lastName, email, role, createdAt FROM users WHERE id = ?',
          [id]
        );

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return user;
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Register a new user
  fastify.post('/register', async (request: FastifyRequest<RegisterRequest>, reply: FastifyReply) => {
    try {
      const { firstName, lastName, email, password, role = 'employee' } = request.body;
      
      // Check if user already exists
      // @ts-ignore - db is added by the plugin
      const [existingUser] = await fastify.db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return reply.code(409).send({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Insert user
      // @ts-ignore - db is added by the plugin
      const result = await fastify.db.execute(
        'INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword, role]
      );
      
      // @ts-ignore - insertId is available on the result
      const userId = result.insertId;
      
      // Generate token
      const token = fastify.jwt.sign({ id: userId, email, role });
      
      return { 
        id: userId,
        firstName,
        lastName,
        email,
        role,
        token
      };
    } catch (error) {
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest<LoginRequest>, reply: FastifyReply) => {
    try {
      const { email, password } = request.body;
      
      // Find user
      // @ts-ignore - db is added by the plugin
      const [user] = await fastify.db.query(
        'SELECT id, firstName, lastName, email, password, role FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      return { 
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token
      };
    } catch (error) {
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update user
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request: FastifyRequest<UpdateRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updates = request.body as UpdateRequest['Body'];
        
        // Ensure user can only update their own profile unless they're admin
        if (request.user.id.toString() !== id && request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Access denied' });
        }
        
        // Prevent updating sensitive fields
        if (request.user.role !== 'admin') {
          delete updates.role;
        }
        
        // If password is being updated, hash it
        if (updates.password) {
          updates.password = await hash(updates.password, 10);
        }
        
        // Build update query
        const fields = Object.keys(updates) as Array<keyof UpdateRequest['Body']>;
        if (fields.length === 0) {
          return reply.code(400).send({ error: 'No fields to update' });
        }
        
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          `UPDATE users SET ${setClause} WHERE id = ?`,
          values
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }
        
        return { success: true, message: 'User updated successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // Delete user (admin only)
  fastify.delete('/:id', {
    onRequest: [fastify.requireAdmin],
    handler: async (request: FastifyRequest<GetUserRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // @ts-ignore - db is added by the plugin
        const result = await fastify.db.execute(
          'DELETE FROM users WHERE id = ?',
          [id]
        );
        
        // @ts-ignore - affectedRows is available on the result
        if (result.affectedRows === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }
        
        return { success: true, message: 'User deleted successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  });
} 