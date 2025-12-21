'use client'; // ⚠️ Obrigatório para usar onClick e hooks

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex justify-between p-4 bg-gray-800 text-white">
      <Link href="/" className="font-bold text-xl">
        Minha Logo
      </Link>

      <div className="flex gap-4">
        {status === 'loading' ? (
          <p>Carregando...</p>
        ) : session ? (
          // --- USUÁRIO LOGADO ---
          <>
            <span>Olá, {session.user?.name}</span>
            <Link href="/dashboard" className="bg-blue-600 px-3 py-1 rounded">
              Dashboard
            </Link>
            <button 
              onClick={() => signOut()} 
              className="bg-red-600 px-3 py-1 rounded"
            >
              Sair
            </button>
          </>
        ) : (
          // --- USUÁRIO DESLOGADO ---
          <button 
            onClick={() => signIn()} 
            className="bg-green-600 px-3 py-1 rounded"
          >
            Entrar
          </button>
        )}
      </div>
    </nav>
  );
}