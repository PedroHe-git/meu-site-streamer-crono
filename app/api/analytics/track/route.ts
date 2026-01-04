import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, path, details } = body; 

    // 🔥 DEBUG: Vai aparecer no terminal do VS Code quando você clicar
    console.log("📥 API Analytics Recebeu:", { event, details, path });

    if (event === "PAGE_VIEW" && path) {
        await prisma.pageView.upsert({
            where: { path: path },
            create: { path: path, count: 1 },
            update: { count: { increment: 1 } },
        });
    }

    if (event && event !== "PAGE_VIEW") {
        const novoRegistro = await prisma.analytics.create({
            data: {
                event: event,       
                details: details,  
                path: path || "/",
            }
        });
        // 🔥 DEBUG: Confirma que o Prisma salvou
        console.log("✅ Salvo no banco com ID:", novoRegistro.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Analytics Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}