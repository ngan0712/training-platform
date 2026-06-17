import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

const MAX_BYTES = 1_048_576; // 1 MB
const PRINTABLE_ASCII = /^[\x09\x0A\x0D\x20-\x7E\s]{1,}/;

function isProbablyText(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 5120));
  let printable = 0;
  for (const b of bytes) {
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d) {
      printable++;
    }
  }
  return printable / bytes.length > 0.85;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const exerciseId = formData.get("exerciseId");
  const submissionId = formData.get("submissionId");
  const file = formData.get("file");

  if (typeof exerciseId !== "string" || typeof submissionId !== "string") {
    return new Response("Missing exerciseId or submissionId", { status: 400 });
  }

  if (!(file instanceof File)) {
    return new Response("No file provided", { status: 400 });
  }

  if (!file.name.endsWith(".md")) {
    return new Response("Only .md files are accepted", { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return new Response("File must be 1 MB or smaller", { status: 400 });
  }

  const buffer = await file.arrayBuffer();

  if (!isProbablyText(buffer)) {
    return new Response("File does not appear to be plain text", { status: 400 });
  }

  const filePath = `${user.id}/${submissionId}.md`;
  const supabase = createServiceClient();

  const { error } = await supabase.storage.from("exercise-uploads").upload(filePath, buffer, {
    contentType: "text/markdown",
    upsert: true,
  });

  if (error) {
    return new Response(`Storage upload failed: ${error.message}`, { status: 500 });
  }

  return Response.json({ filePath });
}
