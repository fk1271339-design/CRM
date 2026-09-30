import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/permissions";
import {
  SESSION_COOKIE,
  SESSION_DURATION,
  encrypt,
  decrypt,
  type SessionPayload,
} from "@/lib/session";

export { SESSION_COOKIE };

// ─── Session Management ─────────────────────────────────────────────────────

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) throw new Error("User not found");

  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return user;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  return decrypt(cookie);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Require authentication — throws redirect if not authenticated.
 * Use at the top of Server Components or Server Actions.
 */
export async function requireAuth(): Promise<{
  id: string;
  name: string;
  email: string;
  role: Role;
}> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}