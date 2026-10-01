import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkPasscode } from "@/lib/admin-auth";
import { addHolding, deleteHolding, exitHolding, listHoldings } from "@/lib/portfolio-db";

function revalidatePortfolioPages() {
  revalidatePath("/");
  revalidatePath("/portfolio");
}

export async function GET() {
  const holdings = await listHoldings();
  return NextResponse.json({ holdings });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: "Invalid upload passcode." }, { status: 401 });
  }

  const symbol = String(body?.symbol ?? "").trim().toUpperCase();
  const companyName = String(body?.companyName ?? "").trim();
  const sector = String(body?.sector ?? "").trim();
  const quantity = Number(body?.quantity);
  const avgCost = Number(body?.avgCost);
  const entryDate = String(body?.entryDate ?? "").trim();

  if (!symbol || !companyName || !sector || !entryDate) {
    return NextResponse.json(
      { error: "Symbol, company name, sector and entry date are required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(avgCost) || avgCost <= 0) {
    return NextResponse.json(
      { error: "Quantity and average cost must be positive numbers." },
      { status: 400 }
    );
  }

  try {
    const holding = await addHolding({ symbol, companyName, sector, quantity, avgCost, entryDate });
    revalidatePortfolioPages();
    return NextResponse.json({ holding }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add holding." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: "Invalid upload passcode." }, { status: 401 });
  }

  const id = String(body?.id ?? "").trim();
  const exitDate = String(body?.exitDate ?? "").trim();
  const exitPrice = Number(body?.exitPrice);

  if (!id || !exitDate || !Number.isFinite(exitPrice) || exitPrice <= 0) {
    return NextResponse.json(
      { error: "Holding id, exit date and exit price are required." },
      { status: 400 }
    );
  }

  try {
    const ok = await exitHolding(id, exitDate, exitPrice);
    if (!ok) return NextResponse.json({ error: "Holding not found." }, { status: 404 });
    revalidatePortfolioPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to exit holding." },
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
  if (!id) return NextResponse.json({ error: "Missing holding id." }, { status: 400 });

  try {
    await deleteHolding(id);
    revalidatePortfolioPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete holding." },
      { status: 500 }
    );
  }
}
