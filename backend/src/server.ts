import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import prismaPlugin from './plugins/prisma.js';
import authRoutes from './routes/auth.js';
import secretariaRoutes from './routes/secretaria.js';
import cantinaRoutes from './routes/cantina.js';
import alunoRoutes from './routes/aluno.js';
import * as dotenv from 'dotenv';

dotenv.config();

const server = Fastify({
  logger: true
});

// Register CORS
server.register(cors, {
  origin: true // Allow all origins for testing
});

// Register JWT
server.register(jwt, {
  secret: process.env.JWT_SECRET || 'ipocard_super_secret_jwt_key_2026'
});

// Register Prisma Plugin
server.register(prismaPlugin);

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(secretariaRoutes, { prefix: '/api/secretaria' });
server.register(cantinaRoutes, { prefix: '/api/cantina' });
server.register(alunoRoutes, { prefix: '/api/aluno' });

// Health check
server.get('/health', async () => {
  return { status: 'OK', system: 'IPOCARD API' };
});
server.get('/api/health', async () => {
  return { status: 'OK', system: 'IPOCARD API' };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    // Host '0.0.0.0' allows external connections (Docker and network access)
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`IPOCARD Backend running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
