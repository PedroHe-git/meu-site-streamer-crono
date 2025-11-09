// app/dashboard/SettingsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Settings, Loader2, Check, AlertCircle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsTab() {
  // O hook useSession gere a sessão e permite-nos atualizá-la
  const { data: session, status, update } = useSession();

  // Estados para o formulário
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitchUsername, setTwitchUsername] = useState("");
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isListPublic, setIsListPublic] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [message, setSettingsMessage] = useState<{type: "success" | "error", text: string} | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  // Quando a sessão carregar, preenche o formulário com os dados do utilizador
  useEffect(() => {
    if (session) {
      setName(session.user.name || "");
      setBio(session.user.bio || "");
      setTwitchUsername(session.user.twitchUsername || "");
      setIsProfilePublic(session.user.isProfilePublic || false);
      setIsListPublic(session.user.isListPublic || false);
      setAvatarUrl(session.user.image || "");
    }
  }, [session]);

  // Função para salvar Name, Bio, Twitch e Privacidade
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsLoading(true);
    setSettingsMessage(null);

    // Chama a API que JÁ EXISTE no seu projeto
    const res = await fetch('/api/profile/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        bio,
        twitchUsername,
        isProfilePublic,
        isListPublic
      })
    });

    setIsSettingsLoading(false);
    if (res.ok) {
      setSettingsMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      // Atualiza a sessão (localmente) para refletir as mudanças
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          bio,
          twitchUsername,
          isProfilePublic,
          isListPublic
        }
      });
    } else {
      setSettingsMessage({ type: "error", text: "Falha ao atualizar o perfil." });
    }
  };

  // Função para salvar o Avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAvatarLoading(true);
    setSettingsMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    // Chama a API de upload que JÁ EXISTE no seu projeto
    const res = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData
    });

    setIsAvatarLoading(false);
    if (res.ok) {
      const data = await res.json();
      const newImageUrl = data.url;
      
      setAvatarUrl(newImageUrl); // Atualiza o estado local
      setSettingsMessage({ type: "success", text: "Avatar atualizado!" });
      
      // Atualiza a sessão (localmente) com o novo URL da imagem
      await update({
        ...session,
        user: {
          ...session?.user,
          image: newImageUrl
        }
      });
    } else {
      setSettingsMessage({ type: "error", text: "Falha ao carregar o avatar." });
    }
  };

  // O JSX abaixo foi adaptado do seu App.tsx
  return (
    <TabsContent value="configuracoes" className="mt-6">
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Perfil
          </CardTitle>
          <CardDescription>
            Ajuste suas informações públicas e preferências de privacidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsSubmit} className="space-y-8">
            {/* Secção do Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="avatar-upload">Alterar avatar</Label>
                <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isAvatarLoading} />
                <p className="text-sm text-muted-foreground">
                  {isAvatarLoading ? "A carregar..." : "PNG, JPG ou GIF (Max 2MB)"}
                </p>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome público"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fale um pouco sobre você..."
                maxLength={160}
              />
              <p className="text-sm text-muted-foreground text-right">{bio?.length || 0} / 160</p>
            </div>

            {/* Twitch */}
            <div className="space-y-2">
              <Label htmlFor="twitch">Username da Twitch</Label>
              <Input
                id="twitch"
                value={twitchUsername}
                onChange={(e) => setTwitchUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="Seu username da Twitch (para o indicador 'Live')"
              />
            </div>
            
            {/* Privacidade */}
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-semibold">Privacidade</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="isProfilePublic" className="flex flex-col gap-1">
                  <span>Perfil Público</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Permite que outros encontrem seu perfil na busca.
                  </span>
                </Label>
                <Switch
                  id="isProfilePublic"
                  checked={isProfilePublic}
                  onCheckedChange={setIsProfilePublic}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isListPublic" className="flex flex-col gap-1">
                  <span>Visibilidade da Lista</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Permite que outros vejam suas listas de mídias.
                  </span>
                </Label>
                <Switch
                  id="isListPublic"
                  checked={isListPublic}
                  onCheckedChange={setIsListPublic}
                />
              </div>
            </div>

            {/* Mensagens de Feedback */}
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "bg-green-50 border-green-200" : ""}>
                {message.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Botão de Salvar */}
            <Button type="submit" disabled={isSettingsLoading || status !== 'authenticated'}>
              {isSettingsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}