"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/schemas";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type AuthState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // 1. Validate
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // 2. Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: "Invalid email or password" };
  }

  // 3. Check if user is active
  if (!user.isActive) {
    return { message: "Your account has been deactivated. Contact admin." };
  }

  // 4. Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { message: "Invalid email or password" };
  }

  // 5. Create session
  await createSession(user.id);

  // 6. Redirect to dashboard
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
