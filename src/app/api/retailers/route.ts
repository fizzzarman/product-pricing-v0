import { NextResponse } from "next/server";
import { getAllRetailers } from "@/lib/retailers/queries";

export async function GET() {
  const retailers = await getAllRetailers();
  return NextResponse.json({ retailers });
}
