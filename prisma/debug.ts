import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const backupPath = path.join(__dirname, 'meu-backup.json')
  
  try {
    const rawData = fs.readFileSync(backupPath, 'utf-8')
    const data = JSON.parse(rawData)

    console.log("\n🔍 --- ANÁLISE DO BACKUP ---")
    
    // Verifica se é um Array direto ou um Objeto
    if (Array.isArray(data)) {
      console.log("⚠️ O arquivo é uma lista direta (Array).")
      console.log("Primeiro item parece ser:", Object.keys(data[0] || {}))
    } else {
      console.log("✅ O arquivo é um Objeto com as seguintes tabelas:")
      console.log(Object.keys(data)) // <--- ISSO VAI NOS DIZER O NOME CORRETO
      
      // Tenta contar itens comuns
      if (data.User) console.log(`👉 Encontrei 'User': ${data.User.length} itens`)
      if (data.user) console.log(`👉 Encontrei 'user': ${data.user.length} itens`)
      if (data.users) console.log(`👉 Encontrei 'users': ${data.users.length} itens`)
    }
    console.log("---------------------------\n")

  } catch (e) {
    console.error("Erro ao ler arquivo:", e)
  }
}

main()