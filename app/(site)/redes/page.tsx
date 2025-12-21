import { Metadata } from 'next';
import { VideoCarousel } from '@/app/components/portfolio/VideoCarousel'; // 👈 O YouTube que estava no histórico
import { SocialFeed } from '@/app/components/portfolio/SocialFeed';     // 👈 O Instagram/Social

export const metadata: Metadata = {
  title: 'Redes Sociais | Acompanhe Tudo',
  description: 'Vídeos novos no YouTube e fotos exclusivas no Instagram.',
};

export default function RedesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* Cabeçalho da Página */}
      <header className="py-16 text-center bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600">
            Conecte-se Comigo
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Não perca nenhum conteúdo! Inscreva-se no canal e siga no Instagram para bastidores.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 space-y-24 mt-12">
        
        {/* --- SEÇÃO 1: YOUTUBE --- */}
        <section id="youtube" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
            <div className="bg-red-600 text-white p-3 rounded-full shadow-lg shadow-red-600/20">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Últimos Vídeos</h2>
          </div>
          
          {/* Componente do YouTube */}
          <VideoCarousel />
          
          <div className="text-center mt-8">
            <a 
              href="https://youtube.com/@mahcetou" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
            >
              Ver Canal Completo
            </a>
          </div>
        </section>

        {/* Divisor Visual */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50" />

        {/* --- SEÇÃO 2: INSTAGRAM --- */}
        <section id="instagram" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
            <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white p-3 rounded-full shadow-lg shadow-purple-500/20">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.407-.06 3.808-.06zm0 1.832c-2.386 0-2.685.01-3.625.053-.921.042-1.42.196-1.774.333a2.9 2.9 0 00-1.077.702 2.9 2.9 0 00-.702 1.077c-.137.354-.291.853-.333 1.774-.043.94-.053 1.239-.053 3.625s.01 2.685.053 3.625c.042.921.196 1.42.333 1.774.204.53.484.972.932 1.42.448.448.89.728 1.42.932.354.137.853.291 1.774.333.94.043 1.239.053 3.625.053s2.685-.01 3.625-.053c.921-.042 1.42-.196 1.774-.333a2.9 2.9 0 001.077-.702 2.9 2.9 0 00.702-1.077c.137-.354.291-.853.333-1.774.043-.94.053-1.239.053-3.625s-.01-2.685-.053-3.625c-.042-.921-.196-1.42-.333-1.774a2.9 2.9 0 00-.702-1.077 2.9 2.9 0 00-1.077-.702c-.354-.137-.853-.291-1.774-.333-.94-.043-1.239-.053-3.625-.053zm0 4.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 1.832a2.668 2.668 0 110 5.336 2.668 2.668 0 010-5.336zm5.25-3.832a1.096 1.096 0 100 2.192 1.096 1.096 0 000-2.192z" clipRule="evenodd" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Feed do Instagram</h2>
          </div>

          {/* Componente do Instagram */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
             <SocialFeed />
          </div>

        </section>

      </div>
    </div>
  );
}