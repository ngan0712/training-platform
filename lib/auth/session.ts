import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/users";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/schemas/user";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

// Returns the authenticated user from the users table, or null if not signed in.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const row = await getUserById(user.id);
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

// Call at the top of any learner page. Redirects to /sign-in if not authenticated.
export async function requireLearner(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

// Call at the top of any admin page. Redirects unauthenticated users to /sign-in,
// redirects learners to /dashboard.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
