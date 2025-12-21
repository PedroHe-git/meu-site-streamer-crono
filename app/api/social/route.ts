import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Ajuste o caminho conforme seu projeto
import { UserRole } from "@prisma/client";

// ... (Mantenha o GET e POST que já criamos) ...
export async function GET(request: Request) { /* ... código anterior ... */ }
export async function POST(request: Request) { /* ... código anterior ... */ }

// 👇 ADICIONE O DELETE AQUI NO FINAL
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.socialItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}