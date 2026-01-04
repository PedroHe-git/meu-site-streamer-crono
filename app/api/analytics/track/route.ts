import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, label } = body;

    // Validação básica
    if (!type || !label) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Salva no banco (Fire and forget)
    await prisma.analyticsEvent.create({
      data: {
        type,
        label,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Não queremos que o analytics quebre o site, então apenas logamos o erro
    console.error("Erro analytics:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}