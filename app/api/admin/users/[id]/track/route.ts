import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { adminUpdateUserTrack } from "@/lib/db/users";

const BodySchema = z.object({
  track: z.enum(["tech", "non_tech"]).nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let track: "tech" | "non_tech" | null;
  try {
    const body = await request.json();
    const result = BodySchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    track = result.data.track;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  await adminUpdateUserTrack(id, track);
  return NextResponse.json({ ok: true });
}
