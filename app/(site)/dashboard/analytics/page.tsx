import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MousePointerClick, Eye, RefreshCw } from "lucide-react";
import MediaKit from "@/app/components/portfolio/MediaKit"; // 👈 Importando o componente novo
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Garante que os dados estejam sempre frescos
export const dynamic = "force-dynamic"; 

export default async function AnalyticsPage() {
  // --- 1. Busca Dados de Analytics Interno (Últimos 30 dias) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total de Visualizações por Página
  const pageViews = await prisma.analyticsEvent.groupBy({
    by: ['label'],
    where: { 
      type: "PAGE_VIEW",
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: { label: true },
    orderBy: { _count: { label: 'desc' } },
    take: 10
  });

  // Total de Cliques em Links (Sponsors)
  const linkClicks = await prisma.analyticsEvent.groupBy({
    by: ['label'],
    where: { 
      type: "LINK_CLICK",
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: { label: true },
    orderBy: { _count: { label: 'desc' } }
  });

  const totalViews = pageViews.reduce((acc, curr) => acc + curr._count.label, 0);
  const totalClicks = linkClicks.reduce((acc, curr) => acc + curr._count.label, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-purple-500" /> Central de Métricas
          </h1>
          <p className="text-gray-500">Acompanhe o crescimento do canal e engajamento do site.</p>
        </div>
        
        {/* Botão para forçar atualização (link para a API que criamos) */}
        <Button variant="outline" asChild>
            <Link href={`/api/cron/stats?key=${process.env.CRON_SECRET}`} target="_blank">
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Media Kit Agora
            </Link>
        </Button>
      </div>

      {/* --- SEÇÃO 1: MEDIA KIT (Dados Públicos) --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-3">
            Seu Media Kit (Público)
        </h2>
        <p className="text-sm text-gray-400 mb-4">
            Estes são os números que seus patrocinadores veem.
        </p>
        
        {/* 👇 AQUI ESTÁ O COMPONENTE QUE FALTAVA */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 md:p-8">
            <MediaKit />
        </div>
      </div>

      {/* --- SEÇÃO 2: ANALYTICS INTERNO (Dados do Site) --- */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">
            Performance do Site (30 Dias)
        </h2>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="dark:bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total de Pageviews</CardTitle>
                <Eye className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">{totalViews}</div>
            </CardContent>
            </Card>
            <Card className="dark:bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Cliques em Parceiros</CardTitle>
                <MousePointerClick className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">{totalClicks}</div>
            </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tabela de Páginas */}
            <Card className="dark:bg-gray-900 border-gray-800">
            <CardHeader><CardTitle>Páginas Mais Acessadas</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                {pageViews.map((page) => (
                    <div key={page.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                    <span className="text-sm font-medium text-gray-300 truncate max-w-[200px]">
                        {page.label === '/' ? 'Home (Início)' : page.label}
                    </span>
                    <span className="font-bold text-white">{page._count.label}</span>
                    </div>
                ))}
                {pageViews.length === 0 && <p className="text-gray-500 text-sm">Sem dados ainda.</p>}
                </div>
            </CardContent>
            </Card>

            {/* Tabela de Cliques */}
            <Card className="dark:bg-gray-900 border-gray-800">
            <CardHeader><CardTitle>Performance de Links (Sponsors)</CardTitle></CardHeader>
            <CardContent>
                {linkClicks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Nenhum clique registrado nos últimos 30 dias.
                    </div>
                ) : (
                    <div className="space-y-4">
                    {linkClicks.map((link) => (
                        <div key={link.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <span className="text-sm font-medium text-gray-300">{link.label}</span>
                        <span className="font-bold text-green-400">{link._count.label} cliques</span>
                        </div>
                    ))}
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>

    </div>
  );
}