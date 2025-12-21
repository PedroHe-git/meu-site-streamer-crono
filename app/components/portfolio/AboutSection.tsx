// components/AboutSection.tsx
import Image from 'next/image'; // Importe o componente Image do Next.js
import { Button } from "@/components/ui/button"; // Assumindo que você quer um botão para redes sociais

export function AboutSection() {
  return (
    <section id="sobre" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Lado Esquerdo: Imagem do Avatar/Perfil */}
          <div className="md:order-1 flex justify-center">
            {/* Usamos o componente Image do Next.js para otimização */}
            <Image
              src="/avatar-do-streamer.png" // Substitua pelo caminho da sua imagem na pasta /public
              alt="Avatar do Streamer"
              width={400} // Defina a largura
              height={400} // Defina a altura
              className="rounded-full object-cover w-64 h-64 md:w-80 md:h-80 shadow-lg border-4 border-purple-600"
            />
          </div>

          {/* Lado Direito: Texto da Bio */}
          <div className="md:order-2 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-4">Sobre Mim / Quem Sou</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              bla-bla-bla eu como terra bla-bla-bla bla-bla-bla bla-bla-bla 
              bla-bla-bla bla-bla-bla 
              bla-bla-bla bla-bla-bla bla-bla-bla bla-bla-bla bla-bla-bla 
              bla-bla-bla bla-bla-bla
              bla-bla-bla bla-bla-bla 
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              comecei com essa merda em ... e venho me esforçando a bla-bla-bla bla-bla-bla bla-bla-bla 
              adoro interagir com bla-bla-bla bla-bla-bla bla-bla-bla bla-bla-bla 
               
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {/* Exemplo de botão para redes sociais */}
              <Button className="bg-purple-600 hover:bg-purple-700">
                Me siga na Twitch
              </Button>
              <Button variant="outline">Conheça meu Instagram</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}