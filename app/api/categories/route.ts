import { NextResponse } from "next/server";
import categories from "@/data/categories.json";
import { newRequestId } from "@/lib/utils/errors";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ success: true, ...categories, requestId: newRequestId() });
}
