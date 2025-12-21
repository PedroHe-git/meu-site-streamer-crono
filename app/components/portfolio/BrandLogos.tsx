"use client";

import { Handshake, Zap, Monitor, Cpu, MousePointer2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image"; // Importado caso vá usar imagens reais

// Lista de Parceiros (Edite aqui)
const partners = [
  {
    name: "Levanta Morto",
    category: "Viagra",
    // Se tiver imagem: logoUrl: "/logos/logitech.png",
    icon: MousePointer2, // Placeholder
    color: "hover:text-cyan-400",
    description: "Deixa até água dura."
  },
  {
    name: "Pammpers",
    category: "Fraldas",
    // logoUrl: "/logos/redbull.png",
    icon: Zap,
    color: "hover:text-red-500",
    description: "Relaxe e cague."
  },
  {
    name: "Yoki",
    category: "Alimentos",
    // logoUrl: "/logos/obs.png",
    icon: Monitor,
    color: "hover:text-purple-500",
    description: "As melhores pipocas para se comer com vinagrezinho."
  },
  {
    name: "MarçalCorp",
    category: "Mentoria",
    // logoUrl: "/logos/nvidia.png",
    icon: Cpu,
    color: "hover:text-green-500",
    description: "Aprenda ou fique pobre."
  },
];

export default function BrandLogos() {
  return (
    <section className="py-20 bg-gray-900/50 border-t border-gray-800">
      <div className="container mx-auto px-4">
        
        {/* Título da Seção */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Handshake className="w-4 h-4" />
            Parceiros & Sponsors
          </h2>
          <h3 className="text-3xl md:text-4xl font-black text-white">
            Marcas que apoiam o projeto
          </h3>
        </div>

        {/* Grid de Logos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="group relative bg-gray-950 border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-gray-600 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Efeito de Brilho no Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />

              {/* Ícone/Logo */}
              <div className={`mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-gray-900 group-hover:bg-gray-800 transition-colors ${partner.color}`}>
                {/* DICA: Para usar imagem real, comente o <partner.icon> e descomente o <Image> abaixo:
                   <Image src={partner.logoUrl} alt={partner.name} width={64} height={64} className="object-contain grayscale group-hover:grayscale-0 transition-all" />
                */}
                <partner.icon className="w-8 h-8 text-gray-400 group-hover:text-current transition-colors duration-300" />
              </div>

              <h4 className="text-xl font-bold text-white mb-1">{partner.name}</h4>
              <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded mb-3">
                {partner.category}
              </span>
              <p className="text-gray-400 text-sm leading-relaxed">
                {partner.description}
              </p>
            </div>
          ))}

          {/* Card Especial: CTA para Novos Patrocinadores */}
          <div className="group relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-purple-500/50 transition-all">
             <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-purple-400" />
             </div>
             <h4 className="text-xl font-bold text-white mb-2">Sua Marca Aqui</h4>
             <p className="text-gray-400 text-sm mb-6">
               Quer divulgar seu produto para nossa comunidade engajada?
             </p>
             <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white" asChild>
                <Link href="/contato">
                   Entrar em Contato
                </Link>
             </Button>
          </div>

        </div>
      </div>
    </section>
  );
}