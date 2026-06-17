import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { adminClearUserHistory } from "@/lib/db/users";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json({ error: "Cannot clear your own history" }, { status: 400 });
  }

  await adminClearUserHistory(id);
  return NextResponse.json({ ok: true });
}
