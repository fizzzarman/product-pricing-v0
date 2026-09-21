import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_COOKIE = "daamkoto_admin";
const bodySchema = z.object({ secret: z.string().min(1) });

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  if (!process.env.ADMIN_SECRET || parsed.data.secret !== process.env.ADMIN_SECRET) {
    // Constant-shape response regardless of failure reason — don't leak whether ADMIN_SECRET is configured.
    return NextResponse.json({ error: "Invalid admin secret" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, parsed.data.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return response;
}
