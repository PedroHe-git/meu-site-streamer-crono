// app/api/auth/register/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Registros desativados." }, { status: 403 });
}