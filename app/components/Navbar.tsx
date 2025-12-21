'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Share2, Handshake } from 'lucide-react'; // 1. Importe o ícone Handshake

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-white hover:text-purple-400 transition-colors">
          Hub MahMoojen
        </Link>

        <div className="flex items-center gap-4">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse bg-gray-800 rounded-full" />
          ) : session ? (
            <>
              <span className="text-gray-400 text-sm hidden md:block">
                Olá, <span className="text-white font-medium">{session.user?.name}</span>
              </span>
              
              <div className="h-6 w-px bg-gray-800 mx-2" />

              {/* Botão Dashboard */}
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm transition-all"
                title="Painel Geral"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Painel</span>
              </Link>

              {/* Botão Redes Sociais */}
              <Link 
                href="/dashboard/social" 
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-md text-sm transition-all"
                title="Youtube & Insta"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Redes</span>
              </Link>

              {/* 👇 2. NOVO BOTÃO: Patrocinadores */}
              <Link 
                href="/dashboard/sponsors" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-all"
                title="Gerenciar Patrocínios"
              >
                <Handshake className="w-4 h-4" />
                <span className="hidden sm:inline">Sponsors</span>
              </Link>

              <button 
                onClick={() => signOut()} 
                className="text-red-500 hover:text-red-400 text-sm font-medium px-2 ml-2"
              >
                Sair
              </button>
            </>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}