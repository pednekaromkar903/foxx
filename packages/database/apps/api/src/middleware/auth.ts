import { Request, Response, NextFunction } from 'express';

// Mock types since we don't have the full project
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Mock authentication - in real app, this would verify JWT
  // For this fix, we assume req.user is already populated by previous middleware
  // or we just provide the structure for authorize to work.
  if (!req.user) {
    // In a real fix, you'd check headers here.
    // For now, we'll just proceed to allow authorize to be the gatekeeper.
  }
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
