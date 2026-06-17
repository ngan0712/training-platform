import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getMaterialById } from "@/lib/db/materials";
import { getModuleById } from "@/lib/db/modules";
import { recordClick } from "@/lib/db/clicks";

const BodySchema = z.object({
  materialId: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let materialId: string;
  try {
    const formData = await request.formData();
    const result = BodySchema.safeParse({
      materialId: formData.get("materialId"),
    });
    if (!result.success) {
      return NextResponse.json({ error: "Invalid materialId" }, { status: 400 });
    }
    materialId = result.data.materialId;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const material = await getMaterialById(materialId);
  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mod = await getModuleById(material.module_id);
  if (!mod) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await recordClick(user.id, materialId);

  revalidatePath("/dashboard");
  revalidatePath(`/modules/${mod.id}`);

  return NextResponse.redirect(material.url, { status: 302 });
}
