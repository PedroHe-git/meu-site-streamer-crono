"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Youtube, Instagram, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Se não tiver toast, pode remover
import Image from "next/image";

type SocialItem = {
  id: string;
  platform: "YOUTUBE" | "INSTAGRAM";
  title: string;
  imageUrl: string;
  linkUrl: string;
  subtitle: string;
};

export default function SocialDashboard() {
  const [items, setItems] = useState<SocialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Formulário
  const [formData, setFormData] = useState({
    platform: "YOUTUBE",
    title: "",
    imageUrl: "",
    linkUrl: "",
    subtitle: ""
  });

  // Carregar itens
  const fetchItems = async () => {
    setLoading(true);
    try {
      // Busca tudo (sem filtro de plataforma para mostrar lista geral ou filtrar no front)
      const resYt = await fetch("/api/social?platform=YOUTUBE");
      const resInsta = await fetch("/api/social?platform=INSTAGRAM");
      const dataYt = await resYt.json();
      const dataInsta = await resInsta.json();
      
      // Junta as listas se não der erro
      setItems([...(Array.isArray(dataYt) ? dataYt : []), ...(Array.isArray(dataInsta) ? dataInsta : [])]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Criar Item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Item adicionado com sucesso!" });
        setFormData({ ...formData, title: "", imageUrl: "", linkUrl: "", subtitle: "" }); // Limpa form
        fetchItems(); // Recarrega lista
      } else {
        toast({ title: "Erro ao adicionar", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Deletar Item
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que quer remover este destaque?")) return;
    try {
      await fetch(`/api/social?id=${id}`, { method: "DELETE" });
      setItems(items.filter((item) => item.id !== id));
      toast({ title: "Item removido" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Redes Sociais</h1>
        <p className="text-gray-500">Escolha o que aparece nas seções de destaque da Home.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- FORMULÁRIO DE ADIÇÃO (Esquerda) --- */}
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>Adicionar Novo Destaque</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.platform === "YOUTUBE" ? "default" : "outline"}
                    className={formData.platform === "YOUTUBE" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setFormData({ ...formData, platform: "YOUTUBE" })}
                  >
                    <Youtube className="w-4 h-4 mr-2" /> YouTube
                  </Button>
                  <Button
                    type="button"
                    variant={formData.platform === "INSTAGRAM" ? "default" : "outline"}
                    className={formData.platform === "INSTAGRAM" ? "bg-pink-600 hover:bg-pink-700" : ""}
                    onClick={() => setFormData({ ...formData, platform: "INSTAGRAM" })}
                  >
                    <Instagram className="w-4 h-4 mr-2" /> Instagram
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título / Legenda</Label>
                <Input 
                  placeholder={formData.platform === "YOUTUBE" ? "Título do Vídeo" : "Legenda do Post"} 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>URL da Imagem (Capa/Foto)</Label>
                <Input 
                  placeholder="https://..." 
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-400">Dica: Clique com botão direito na thumb do YouTube > Copiar endereço da imagem.</p>
              </div>

              <div className="space-y-2">
                <Label>Link de Destino</Label>
                <Input 
                  placeholder="Link para o vídeo ou post" 
                  value={formData.linkUrl}
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Subtítulo (Opcional)</Label>
                <Input 
                  placeholder={formData.platform === "YOUTUBE" ? "Ex: 10min • 5k views" : "Ex: ❤️ 1.2k likes"} 
                  value={formData.subtitle}
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Destaque
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* --- LISTA DE ITENS EXISTENTES (Direita) --- */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="YOUTUBE" className="w-full">
            <TabsList>
              <TabsTrigger value="YOUTUBE">YouTube ({items.filter(i => i.platform === "YOUTUBE").length})</TabsTrigger>
              <TabsTrigger value="INSTAGRAM">Instagram ({items.filter(i => i.platform === "INSTAGRAM").length})</TabsTrigger>
            </TabsList>
            
            {["YOUTUBE", "INSTAGRAM"].map((platform) => (
              <TabsContent key={platform} value={platform} className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.filter(i => i.platform === platform).map((item) => (
                    <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="relative aspect-video bg-gray-100">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-gray-400">Sem imagem</div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                           <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(item.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold line-clamp-1" title={item.title}>{item.title}</h4>
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                           <span>{item.subtitle || "-"}</span>
                           <a href={item.linkUrl} target="_blank" className="hover:text-blue-500">
                             <ExternalLink className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {items.filter(i => i.platform === platform).length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-500 border border-dashed rounded-lg">
                      Nenhum item adicionado nesta lista.
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

      </div>
    </div>
  );
}