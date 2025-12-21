import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  try {
    // Encontra o caminho para o arquivo JSON
    const jsonDirectory = path.join(process.cwd(), "lib");
    // Lê o arquivo
    const fileContents = await fs.readFile(
      path.join(jsonDirectory, "instagram-data.json"),
      "utf8"
    );
    // Transforma o texto do arquivo em JSON
    const data = JSON.parse(fileContents);

    // Retorna os dados
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Falha ao ler dados dos posts." }),
      { status: 500 }
    );
  }
}