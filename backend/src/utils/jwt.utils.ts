import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';

if (!secret) throw new Error('JWT_SECRET env variable is not set');

const JWT_SECRET = secret as string;

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  departmentId: number | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
}
