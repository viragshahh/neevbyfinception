import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkPasscode } from "@/lib/admin-auth";
import { addDecision, deleteDecision, listDecisions } from "@/lib/portfolio-db";

const VALID_DECISIONS = ["BUY", "HOLD", "SELL"];

function revalidateDecisionPages() {
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/register");
}

export async function GET() {
  const decisions = await listDecisions();
  return NextResponse.json({ decisions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: "Invalid upload passcode." }, { status: 401 });
  }

  const date = String(body?.date ?? "").trim();
  const sector = String(body?.sector ?? "").trim();
  const decision = String(body?.decision ?? "").trim().toUpperCase();
  const rationale = String(body?.rationale ?? "").trim();
  const companyName = body?.companyName ? String(body.companyName).trim() : null;
  const symbol = body?.symbol ? String(body.symbol).trim().toUpperCase() : null;
  const voteCount = body?.voteCount ? String(body.voteCount).trim() : null;

  if (!date || !sector || !rationale || !VALID_DECISIONS.includes(decision)) {
    return NextResponse.json(
      { error: "Date, sector, a valid decision (BUY/HOLD/SELL) and rationale are required." },
      { status: 400 }
    );
  }

  try {
    const entry = await addDecision({
      date,
      sector,
      companyName,
      symbol,
      decision: decision as "BUY" | "HOLD" | "SELL",
      rationale,
      voteCount,
    });
    revalidateDecisionPages();
    return NextResponse.json({ decision: entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save decision." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: "Invalid upload passcode." }, { status: 401 });
  }
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing decision id." }, { status: 400 });

  try {
    await deleteDecision(id);
    revalidateDecisionPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete decision." },
      { status: 500 }
    );
  }
}
