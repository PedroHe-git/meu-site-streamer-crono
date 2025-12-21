"use client";

import Link from "next/link";
import { Github, Twitter, Instagram, Youtube, Lock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020202] border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Coluna 1: Marca */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                M
              </div>
              <span>MahMoojen</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Criando conteúdo, compartilhando gameplay e construindo uma comunidade incrível. 
              Junte-se a nós nas lives e redes sociais.
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="font-bold text-white mb-4">Explorar</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/cronograma" className="hover:text-purple-400 transition-colors">Cronograma</Link></li>
              <li><Link href="/historico" className="hover:text-purple-400 transition-colors">VODs & Contéudos Assistidos</Link></li>
              <li><Link href="/sobre" className="hover:text-purple-400 transition-colors">Sobre Mim</Link></li>
              <li><Link href="/parceiros" className="hover:text-purple-400 transition-colors">Patrocinar</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Redes */}
          <div>
            <h3 className="font-bold text-white mb-4">Conecte-se</h3>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/mahmoojen/" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.youtube.com/@mahcetou" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © {currentYear} MahMoojen. Todos os direitos reservados.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="/termos" className="text-gray-600 text-xs hover:text-gray-400">Termos de Uso</Link>
            
            {/* 👇 AQUI ESTÁ O LOGIN DISCRETO */}
            <Link 
              href="/api/auth/signin" 
              className="flex items-center gap-1 text-gray-700 text-xs hover:text-purple-500 transition-colors"
              title="Acesso Restrito"
            >
              <Lock className="w-3 h-3" /> Área do Criador
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}