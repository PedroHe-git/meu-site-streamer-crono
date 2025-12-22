"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; // 👈 1. Importado
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Handshake, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Sponsor = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
};

export default function SponsorsDashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    imageUrl: "",
    linkUrl: "",
    description: ""
  });

  const fetchSponsors = async () => {
    try {
      const res = await fetch("/api/sponsors", { cache: "no-store" });
      const data = await res.json();
      setSponsors(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSponsors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Patrocinador adicionado!" });
        setFormData({ name: "", category: "", imageUrl: "", linkUrl: "", description: "" });
        fetchSponsors();
      } else {
        toast({ title: "Erro ao adicionar", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este patrocinador?")) return;
    await fetch(`/api/sponsors?id=${id}`, { method: "DELETE" });
    setSponsors(sponsors.filter((s) => s.id !== id));
    toast({ title: "Removido com sucesso" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Handshake className="text-purple-500" /> Patrocinadores
        </h1>
        <p className="text-gray-500">Gerencie as marcas que aparecem na home do site.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário */}
        <Card className="lg:col-span-4 h-fit border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Novo Parceiro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Marca</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Logitch" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Periféricos" />
              </div>
              <div className="space-y-2">
                <Label>URL da Logo (Imagem)</Label>
                <Input required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Link do Site (Opcional)</Label>
                <Input value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Descrição / Cupom</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Use o cupom LIVE10" />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="dark:bg-gray-900 dark:border-gray-800 relative group overflow-hidden hover:border-purple-500/50 transition-colors">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(sponsor.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
               
               <CardContent className="p-6 flex flex-col items-center text-center">
                  {/* 2. Container da Imagem com o componente Next/Image */}
                  <div className="relative w-24 h-24 mb-4 bg-white/5 rounded-full flex items-center justify-center p-4 overflow-hidden border border-white/10">
                     {sponsor.imageUrl ? (
                        <Image 
                            src={sponsor.imageUrl} 
                            alt={sponsor.name} 
                            fill
                            className="object-contain p-2"
                            unoptimized={true} // 👈 Previne erros de domínio e warnings
                        />
                     ) : (
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                     )}
                  </div>
                  
                  <h3 className="font-bold text-lg dark:text-white">{sponsor.name}</h3>
                  <span className="text-xs text-purple-400 font-mono mb-2">{sponsor.category}</span>
                  <p className="text-sm text-gray-400 line-clamp-2">{sponsor.description}</p>
               </CardContent>
            </Card>
          ))}
          {sponsors.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900/50">
              Nenhum patrocinador cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}