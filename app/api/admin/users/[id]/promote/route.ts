import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { adminPromoteToAdmin } from "@/lib/db/users";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await adminPromoteToAdmin(id);
  return NextResponse.json({ ok: true });
}
