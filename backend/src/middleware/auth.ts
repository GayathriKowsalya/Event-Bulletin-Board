import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    token: string;
    role?: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Try custom JWT for demo admin first
  const jwtSecret = process.env.ADMIN_JWT_SECRET || 'fallback_secret_key';
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (decoded && decoded.role === 'admin') {
      req.user = {
        id: decoded.id,
        email: decoded.username,
        token,
        role: 'admin'
      };
      return next();
    }
  } catch (err) {
    // Not a valid custom JWT, fall through to Supabase auth
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      token,
      role: profile?.role || 'user'
    };
    
    console.log(`[AUTH] Validated JWT for user ID: ${user.id}`);
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  });
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  // Try custom JWT for demo admin first
  const jwtSecret = process.env.ADMIN_JWT_SECRET || 'fallback_secret_key';
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (decoded && decoded.role === 'admin') {
      req.user = {
        id: decoded.id,
        email: decoded.username,
        token,
        role: 'admin'
      };
      return next();
    }
  } catch (err) {
    // Not a valid custom JWT, fall through to Supabase auth
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      req.user = {
        id: user.id,
        email: user.email,
        token,
        role: profile?.role || 'user'
      };
    }
    next();
  } catch (err) {
    next();
  }
};
