"use client";

import { useState } from "react";
import { Download, Mail, Send, Loader2, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Envia para a API que criamos (Resend)
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Mensagem enviada! 🚀", description: "Responderei o mais breve possível." });
        setFormData({ name: "", email: "", company: "", message: "" });
      } else {
        toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 relative flex items-center overflow-hidden">
      
      {/* Elementos de Fundo (Luzes Ambientais) */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* --- COLUNA ESQUERDA: INFORMAÇÕES & MIDIA KIT --- */}
          <div className="space-y-10">
            
            {/* Cabeçalho */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider mb-4">
                TRABALHE COMIGO
              </span>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                Vamos criar algo <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                  extraordinário?
                </span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Estou sempre aberto a novas parcerias, projetos de publicidade e ideias criativas. Conte-me sobre sua visão.
              </p>
            </div>

            {/* Card de Download do Mídia Kit */}
            <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-purple-500/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                   <h3 className="text-xl font-bold text-white mb-1">Mídia Kit 2025</h3>
                   <p className="text-gray-400 text-sm mb-4">Baixe o PDF com métricas, público e cases.</p>
                   
                   <Button className="bg-white text-black hover:bg-gray-200 font-bold" asChild>
                      <a href="/media-kit-streamer.pdf" download>
                         <Download className="mr-2 h-4 w-4" /> Baixar Arquivo
                      </a>
                   </Button>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                   <Download className="w-6 h-6 text-gray-400 group-hover:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Informações de Contato Rápido */}
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                     <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">E-mail para contato</p>
                     <p className="font-medium text-white">contato@mahmoojen.com</p>
                  </div>
               </div>
               
              </div>
          </div>

          {/* --- COLUNA DIREITA: FORMULÁRIO --- */}
          <div className="bg-gray-900/30 border border-white/5 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative">
            
            {/* Brilho decorativo no formulário */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />

            <h2 className="text-2xl font-bold text-white mb-6">Envie uma mensagem</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-400">Nome</Label>
                  <Input 
                    id="name" required 
                    className="bg-black/40 border-gray-800 text-white focus:border-purple-500 h-12" 
                    placeholder="Seu nome" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-400">Empresa</Label>
                  <Input 
                    id="company" 
                    className="bg-black/40 border-gray-800 text-white focus:border-purple-500 h-12" 
                    placeholder="Nome da empresa" 
                    value={formData.company} 
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400">E-mail</Label>
                <Input 
                  id="email" type="email" required 
                  className="bg-black/40 border-gray-800 text-white focus:border-purple-500 h-12" 
                  placeholder="contato@empresa.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-400">Mensagem</Label>
                <Textarea 
                  id="message" required 
                  className="bg-black/40 border-gray-800 text-white focus:border-purple-500 min-h-[150px] resize-none" 
                  placeholder="Conte um pouco sobre o projeto..." 
                  value={formData.message} 
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-12 shadow-lg shadow-purple-900/20" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {loading ? "Enviando..." : "Enviar Proposta"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}