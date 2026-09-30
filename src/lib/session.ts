import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/permissions";

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: Date;
}

export const SESSION_COOKIE = "faiz-crm-session";
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const secretKey = process.env.AUTH_SECRET || "faiz-crm-secret-key-fallback";
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}