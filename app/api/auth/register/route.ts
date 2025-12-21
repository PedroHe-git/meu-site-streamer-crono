import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Retorna erro 403 (Proibido) para qualquer tentativa de criar conta
  return new NextResponse("O registro de novos usuários está desativado pelo administrador.", { status: 403 });
}