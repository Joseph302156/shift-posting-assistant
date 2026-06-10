import { NextResponse } from "next/server";
import { generateShiftPost } from "@/lib/generate";
import type { GenerateRequestBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const request = body?.request?.trim();
  if (!request) {
    return NextResponse.json({ error: "Describe the shift you need to staff." }, { status: 400 });
  }
  if (request.length > 2000) {
    return NextResponse.json({ error: "Request is too long (2000 char max)." }, { status: 400 });
  }

  try {
    const result = await generateShiftPost(request);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[shift-assistant] generation error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the shift post. Please try again." },
      { status: 500 },
    );
  }
}
