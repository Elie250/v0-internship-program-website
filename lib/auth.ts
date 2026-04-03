import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';

interface AuthUser {
  user: { id: string } | null;
}

// Hash password with bcryptjs
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

// Verify password with bcryptjs
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

// Generate simple token
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get auth user from request
export async function getAuthUser(req: NextRequest): Promise<AuthUser> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return { user: null };

    const token = authHeader.split(' ')[1];
    if (!token) return { user: null };

    return { user: { id: token } };
  } catch (err) {
    console.error('Auth error:', err);
    return { user: null };
  }
}
