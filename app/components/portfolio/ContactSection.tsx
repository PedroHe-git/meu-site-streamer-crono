"use client";

import { Download, Mail, Users, Video, TrendingUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Esta funcionalidade precisa de um backend configurado (ex: Resend ou EmailJS).");
    setFormData({ name: "", email: "", company: "", message: "" });
  };

  const services = [
    {
      icon: Video,
      title: "Vídeos Dedicados",
      description: "Conteúdo exclusivo produzido para o seu produto ou lançamento.",
    },
    {
      icon: Users,
      title: "Lives Patrocinadas",
      description: "Gameplay ou React ao vivo para uma audiência engajada.",
    },
    {
      icon: TrendingUp,
      title: "Divulgação Social",
      description: "Posts no Instagram, Twitter e Comunidade do Discord.",
    },
  ];

  return (
    <section id="contato" className="py-20 bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4">
        
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Vamos Criar Algo Juntos?
          </h2>
          <p className="text-gray-400 text-lg">
            Tem uma proposta comercial, parceria ou apenas quer dar um oi? 
            Preencha o formulário ou baixe o Media Kit para saber mais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          {/* Coluna da Esquerda: Serviços e Media Kit */}
          <div className="space-y-8">
            <div className="grid gap-6">
                {services.map((service, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-900/20 text-purple-400 rounded-lg flex items-center justify-center">
                        <service.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{service.title}</h3>
                        <p className="text-sm text-gray-400">{service.description}</p>
                    </div>
                </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Media Kit 2025</h3>
                <p className="text-gray-400 mb-6 text-sm">
                    Confira nossas métricas, público-alvo e cases de sucesso.
                </p>
                <Button size="lg" className="w-full bg-white text-black hover:bg-gray-200 font-bold" asChild>
                    <a href="/media-kit-streamer.pdf" download>
                        <Download className="mr-2 h-4 w-4" /> Baixar PDF
                    </a>
                </Button>
            </div>
          </div>

          {/* Coluna da Direita: Formulário */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Mail className="text-purple-500" /> 
                Envie uma Mensagem
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Nome</Label>
                  <Input id="name" required className="bg-gray-950 border-gray-700 text-white focus:border-purple-500" placeholder="Seu nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">Empresa</Label>
                  <Input id="company" className="bg-gray-950 border-gray-700 text-white focus:border-purple-500" placeholder="Nome da empresa" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-mail Comercial</Label>
                <Input id="email" type="email" required className="bg-gray-950 border-gray-700 text-white focus:border-purple-500" placeholder="contato@empresa.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">Mensagem</Label>
                <Textarea id="message" required className="bg-gray-950 border-gray-700 text-white focus:border-purple-500 min-h-[150px]" placeholder="Como podemos trabalhar juntos?" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
              </div>

              <Button type="submit" size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12">
                <Send className="mr-2 h-4 w-4" /> Enviar Proposta
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}