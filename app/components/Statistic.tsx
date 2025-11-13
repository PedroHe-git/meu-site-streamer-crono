"use client";

import { useState, useEffect, useMemo } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart, PieChart, Film, Tv, Play, List } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ResponsiveContainer, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

// Tipos para os dados da API
type StatsData = {
  totalWatched: number;
  statsByType: Record<string, number>;
  watchedOverTime: { watchedAt: string; mediaType: string }[];
};

// Cores para o gráfico de pizza
const COLORS = {
  MOVIE: '#8884d8',
  SERIES: '#82ca9d',
  ANIME: '#ffc658',
  OUTROS: '#ff8042',
};

const iconMap = {
  MOVIE: <Film className="h-5 w-5" />,
  SERIES: <Tv className="h-5 w-5" />,
  ANIME: <Play className="h-5 w-5" />,
  OUTROS: <List className="h-5 w-5" />,
};

export default function StatsTab() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/profile/stats');
        if (!res.ok) throw new Error('Falha ao buscar estatísticas');
        const stats: StatsData = await res.json();
        setData(stats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Processa os dados para o gráfico de barras
  const barChartData = useMemo(() => {
    if (!data) return [];

    const currentYear = new Date().getFullYear();
    
    // Filtra apenas os itens deste ano
    const thisYearData = data.watchedOverTime.filter(item => 
      getYear(new Date(item.watchedAt)) === currentYear
    );

    // Agrupa por mês
    const monthlyCounts = thisYearData.reduce((acc, item) => {
      const month = getMonth(new Date(item.watchedAt)); // 0 = Jan, 1 = Fev...
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Formata para o gráfico
    return Array.from({ length: 12 }).map((_, i) => ({
      name: format(new Date(currentYear, i, 1), 'MMM', { locale: ptBR }),
      total: monthlyCounts[i] || 0,
    }));
  }, [data]);

  // Processa os dados para o gráfico de pizza
  const pieChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.statsByType).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);


  if (isLoading) {
    return (
      <TabsContent value="stats" className="mt-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </TabsContent>
    );
  }

  if (error || !data) {
    return (
      <TabsContent value="stats" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error || "Não foi possível carregar os dados."}</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="stats" className="mt-6 space-y-6">
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Assistido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalWatched}</div>
            <p className="text-sm text-muted-foreground">itens concluídos</p>
          </CardContent>
        </Card>
        
        {Object.entries(data.statsByType).map(([type, count]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {iconMap[type as keyof typeof iconMap] || <Film className="h-5 w-5" />}
                {type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{count}</div>
              <p className="text-sm text-muted-foreground">itens</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Barras - Atividade Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Itens Assistidos em {new Date().getFullYear()}</CardTitle>
          <CardDescription>Itens concluídos por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ReBarChart data={barChartData}>
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                name="Total"
              />
            </ReBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </TabsContent>
  );
}