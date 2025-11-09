// Este é o seu ficheiro, apenas com o nome da função alterado de HomePage para LandingPage
"use client"; // Adicionado "use client" pois o 'onClick' requer

import { Film, Calendar, Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Corrigido o caminho
import { Card, CardContent } from "@/components/ui/card"; // Corrigido o caminho

type LandingPageProps = {
  onGetStarted: () => void;
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl mb-8 shadow-2xl">
            <Film className="h-16 w-16 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MeuCronograma
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Organize filmes, séries e animes em listas personalizadas.<br />
            Crie agendas e compartilhe seu cronograma.
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={onGetStarted}
            className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl"
          >
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">100% Gratuito</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6">
                <Film className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Listas Organizadas</h3>
              <p className="text-muted-foreground">
                Gerencie o que vai assistir, está assistindo e já assistiu em listas personalizadas
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Agendamento Fácil</h3>
              <p className="text-muted-foreground">
                Planeje suas sessões com data e horário. Mantenha seu cronograma sempre atualizado
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Perfil Público</h3>
              <p className="text-muted-foreground">
                Compartilhe seu cronograma com outros e descubra o que seus amigos estão assistindo
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Como Funciona
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Busque suas mídias</h3>
                <p className="text-muted-foreground">
                  Pesquise filmes, séries e animes ou adicione manualmente. Marque o que quer assistir.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Organize em listas</h3>
                <p className="text-muted-foreground">
                  Use as listas Próximo Conteúdo, Essa Semana, Já Assistido e Abandonados para total controle.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Crie seu cronograma</h3>
                <p className="text-muted-foreground">
                  Agende datas e horários para seus itens. Marque como concluído quando terminar de assistir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Organize seu entretenimento de forma simples e eficiente
          </p>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-purple-50"
          >
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>&copy; 2025 MeuCronograma. Todos os direitos reservados.</p>
        <p className="text-sm mt-2">meucronograma.live</p>
      </footer>
    </div>
  );
}