// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Cria nome único
  const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
  
  // Caminho para salvar (public/uploads)
  const uploadDir = path.join(process.cwd(), "public/uploads");
  
  try {
    await mkdir(uploadDir, { recursive: true }); // Cria pasta se não existir
    await writeFile(path.join(uploadDir, filename), buffer);
    
    // Retorna a URL pública
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Falha ao salvar arquivo" }, { status: 500 });
  }
}