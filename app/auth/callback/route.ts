import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/auth/admin-emails";
import { upsertUserOnSignIn } from "@/lib/db/users";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const email = user.email.toLowerCase();

  // Domain enforcement — must happen server-side in this callback.
  if (!email.endsWith("@pelago.co")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/sign-in?error=domain`);
  }

  const role = ADMIN_EMAILS.includes(email) ? "admin" : "learner";

  // Upsert users table via service role (bypasses RLS).
  await upsertUserOnSignIn({
    id: user.id,
    email,
    name: user.user_metadata?.full_name ?? "",
    role,
  });

  // Store role in app_metadata so the proxy can read it from the JWT
  // without an extra DB query.
  const serviceClient = createServiceClient();
  await serviceClient.auth.admin.updateUserById(user.id, {
    app_metadata: { role },
  });

  return NextResponse.redirect(`${origin}/dashboard`);
}
