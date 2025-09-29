import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is set - never use fallback in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT authentication with enhanced security
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'rsl-platform',
      audience: 'rsl-users'
    }) as any;
    
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid authentication token.' });
    } else {
      return res.status(403).json({ error: 'Authentication failed.' });
    }
  }
}

// Role-based authorization with enhanced security
export function authorizeRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: roles 
      });
    }
    
    next();
  };
}
