"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Youtube, Instagram, Plus, ExternalLink, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const [formData, setFormData] = useState({
    platform: "YOUTUBE",
    title: "",
    imageUrl: "",
    linkUrl: "",
    subtitle: ""
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const resYt = await fetch("/api/social?platform=YOUTUBE");
      const resInsta = await fetch("/api/social?platform=INSTAGRAM");
      const dataYt = await resYt.json();
      const dataInsta = await resInsta.json();
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

  // --- FUNÇÃO MÁGICA ATUALIZADA (YouTube + Instagram) ---
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    setFormData(prev => ({ ...prev, linkUrl: link }));

    if (!link) return;

    // 1. Lógica do YouTube (Capa em Alta Qualidade)
    if (formData.platform === "YOUTUBE") {
      try {
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = link.match(ytRegex);
        if (match && match[1]) {
          const videoId = match[1];
          setFormData(prev => ({ 
            ...prev, 
            imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
          }));
          toast({ title: "Capa do YouTube detectada! 🪄" });
        }
      } catch (err) {}
    }

    // 2. Lógica do Instagram (Truque do /media)
    if (formData.platform === "INSTAGRAM") {
      try {
        // Aceita links de Post (p), Reel (reel) ou TV
        // Ex: https://www.instagram.com/p/DA_xyz123/
        const instaRegex = /(?:instagram\.com\/(?:p|reel|tv)\/)([\w\-]+)/;
        const match = link.match(instaRegex);
        
        if (match && match[1]) {
          const postId = match[1];
          // Monta a URL mágica que redireciona para a imagem
          const magicUrl = `https://wsrv.nl/?url=instagram.com/p/${postId}/media/?size=l`;
          
          setFormData(prev => ({ ...prev, imageUrl: magicUrl }));
      toast({ title: "Link gerado com proxy (Mais estável) 🛡️" });
        }
      } catch (err) {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Item adicionado com sucesso!" });
        setFormData({ ...formData, title: "", imageUrl: "", linkUrl: "", subtitle: "" });
        fetchItems();
      } else {
        toast({ title: "Erro ao adicionar", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Redes Sociais</h1>
        <p className="text-gray-500 dark:text-gray-400">Cole o link da postagem e tentaremos pegar a imagem automaticamente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <Card className="lg:col-span-4 h-fit border-gray-200 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Adicionar Novo Destaque</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Plataforma</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.platform === "YOUTUBE" ? "default" : "outline"}
                    className={formData.platform === "YOUTUBE" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    onClick={() => {
                        setFormData({ ...formData, platform: "YOUTUBE", imageUrl: "" }); // Limpa imagem ao trocar
                    }}
                  >
                    <Youtube className="w-4 h-4 mr-2" /> YouTube
                  </Button>
                  <Button
                    type="button"
                    variant={formData.platform === "INSTAGRAM" ? "default" : "outline"}
                    className={formData.platform === "INSTAGRAM" ? "bg-pink-600 hover:bg-pink-700 text-white" : ""}
                    onClick={() => {
                        setFormData({ ...formData, platform: "INSTAGRAM", imageUrl: "" }); // Limpa imagem ao trocar
                    }}
                  >
                    <Instagram className="w-4 h-4 mr-2" /> Instagram
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-300">
                    {formData.platform === "YOUTUBE" ? "Link do Vídeo" : "Link do Post / Reel"}
                </Label>
                <div className="relative">
                    <Input 
                        placeholder="https://..." 
                        value={formData.linkUrl}
                        onChange={handleLinkChange} 
                        required
                        className="pr-10"
                    />
                    {formData.linkUrl && (
                        <Wand2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-pulse" />
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-300">Título / Legenda</Label>
                <Input 
                  placeholder={formData.platform === "YOUTUBE" ? "Título do Vídeo" : "Legenda do Post"} 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-300">URL da Imagem</Label>
                <Input 
                  placeholder="Preenchimento automático..." 
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                    {formData.platform === "INSTAGRAM" 
                        ? "Se a imagem do Insta não carregar, clique com botão direito na foto original > Copiar Endereço da Imagem."
                        : "Detectado automaticamente do YouTube."}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-300">Subtítulo (Opcional)</Label>
                <Input 
                  placeholder={formData.platform === "YOUTUBE" ? "Ex: 10min • 5k views" : "Ex: ❤️ 1.2k likes"} 
                  value={formData.subtitle}
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Destaque
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* --- LISTA DE ITENS --- */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="YOUTUBE" className="w-full">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger value="YOUTUBE">YouTube ({items.filter(i => i.platform === "YOUTUBE").length})</TabsTrigger>
              <TabsTrigger value="INSTAGRAM">Instagram ({items.filter(i => i.platform === "INSTAGRAM").length})</TabsTrigger>
            </TabsList>
            
            {["YOUTUBE", "INSTAGRAM"].map((platform) => (
              <TabsContent key={platform} value={platform} className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.filter(i => i.platform === platform).map((item) => (
                    <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-gray-400">Sem imagem</div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(item.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold line-clamp-1 dark:text-gray-100" title={item.title}>{item.title}</h4>
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                           <span>{item.subtitle || "-"}</span>
                           <a href={item.linkUrl} target="_blank" className="hover:text-purple-500">
                             <ExternalLink className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

      </div>
    </div>
  );
}