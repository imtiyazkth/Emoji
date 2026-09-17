import { NextResponse } from "next/server";
import templates from "@/data/templates.json";
import { newRequestId } from "@/lib/utils/errors";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ success: true, ...templates, requestId: newRequestId() });
}
