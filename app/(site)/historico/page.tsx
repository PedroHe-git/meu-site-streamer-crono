import { Metadata } from 'next';
import { AboutSection } from '@/app/components/portfolio/AboutSection';

export const metadata: Metadata = {
  title: 'VODS | Itens Já Vistos',
  description: 'Tenha acesso aos VODS e veja os itens já assistidos.',
};

export default function HistoricoPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mantemos apenas a seção de História/Sobre */}
      <AboutSection />
    </div>
  );
}