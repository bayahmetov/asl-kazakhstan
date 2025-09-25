/**
 * Server bootstrap
 * - Connects to PostgreSQL (via Prisma)
 * - Starts Express server
 */

import app from './app';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
console.log('Multer is:', typeof multer);

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server start error:', err);
    process.exit(1);
  }
}

start();
