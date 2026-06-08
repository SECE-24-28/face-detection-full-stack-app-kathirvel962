// lib/auth.ts
// JWT helpers — sign a token on login, verify it on every protected request.

import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: number;
  email: string;
}

// Read secret at call time so env is guaranteed to be loaded
function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set in .env");
  return s;
}

// Create a token that expires in 24 hours
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "24h" });
}

// Verify token — returns payload or null if invalid/expired
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}
