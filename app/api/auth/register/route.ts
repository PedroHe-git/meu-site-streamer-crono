import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 🛑 BLOQUEIO TOTAL: Ninguém pode criar conta
  return new NextResponse("O registro de novos usuários está desativado.", { status: 403 });

  /* --- CÓDIGO ANTIGO COMENTADO PARA SEGURANÇA ---
  
  const body = await request.json();
  const { email, name, password, username } = body;
  
  // ... resto do seu código antigo ...
  */
}