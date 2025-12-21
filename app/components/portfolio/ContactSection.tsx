"use client";

import { Download, Mail, Users, Video, TrendingUp } from "lucide-react";
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
    // Handle form submission
    alert("Mensagem enviada! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", company: "", message: "" });
  };

  const services = [
    {
      icon: Video,
      title: "Vídeos Integrados",
      description: "Conteúdo personalizado para seu produto",
    },
    {
      icon: Users,
      title: "Lives Patrocinadas",
      description: "Alcance milhares de espectadores ao vivo",
    },
    {
      icon: TrendingUp,
      title: "Posts nas Redes",
      description: "Promoção em todas as plataformas sociais",
    },
  ];

  return (
    <section id="marcas" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center mb-4">
            Vamos Trabalhar Juntos?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Alcance uma audiência engajada e apaixonada por games e tecnologia.
            Descubra como posso ajudar sua marca a crescer.
          </p>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>

          {/* Download Media Kit */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="text-center mb-8">
              <h3 className="mb-2">Media Kit Completo</h3>
              <p className="text-gray-600 mb-6">
                Baixe nosso media kit com estatísticas, alcance e cases de sucesso
              </p>
              <Button size="lg" className="gap-2" asChild>
                <a
                  href="/media-kit-streamer.pdf" 
                  download 
                >
                  <Download className="h-5 w-5" />
                  Baixar Media Kit (PDF)
                </a>
              </Button>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-center mb-6">
                Formulário de Contato Comercial
              </h3>
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail Comercial *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Conte-nos sobre seu projeto..."
                    rows={5}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2">
                  <Mail className="h-5 w-5" />
                  Enviar Mensagem
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
