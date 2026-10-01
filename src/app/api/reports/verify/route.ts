import { NextRequest, NextResponse } from "next/server";
import { checkPasscode } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
