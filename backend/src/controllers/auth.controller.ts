import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Ensure JWT_SECRET is set - never use fallback in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

// Input validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').trim(),
  email: z.string().email('Invalid email address').max(255, 'Email too long').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  role: z.enum(['student', 'instructor'], { errorMap: () => ({ message: 'Role must be student or instructor' }) })
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long').toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long')
});

export async function register(req: Request, res: Response) {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: validation.error.errors.map(err => err.message)
      });
    }

    const { name, email, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    // Hash password with higher cost factor for security
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: validation.error.errors.map(err => err.message)
      });
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Use same error message to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT with shorter expiration for security
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'rsl-platform',
        audience: 'rsl-users'
      }
    );

    // Don't return sensitive user data
    res.json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
