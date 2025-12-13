import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export type AuthContext = {
  userId: string;
  role: string;
};

type VerifyResult = {
  userId: string;
  role?: string;
  [key: string]: unknown;
};

let customVerifier: ((token: string) => Promise<VerifyResult> | VerifyResult) | null = null;

/**
 * Register a custom auth verifier for JWT or external auth providers.
 * Example: registerAuthVerifier(async (token) => verifyWithYourProvider(token));
 */
export const registerAuthVerifier = (
  verifier: (token: string) => Promise<VerifyResult> | VerifyResult
): void => {
  customVerifier = verifier;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring('Bearer '.length);

  const runVerify = async () => {
    if (customVerifier) {
      return customVerifier(token);
    }
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return {
      userId: (decoded.sub as string) || (decoded.userId as string),
      role: (decoded.role as string) || 'user',
      decoded
    } as VerifyResult;
  };

  runVerify()
    .then((result) => {
      const userId = result?.userId;
      const role = result?.role || 'user';

      if (!userId) {
        res.status(401).json({ message: 'Invalid token payload' });
        return;
      }

      (req as any).auth = { userId, role } satisfies AuthContext;
      next();
    })
    .catch((error: Error) => {
      res.status(401).json({ message: 'Unauthorized', error: error.message });
    });
};
