import "../globals.css"; // Importa o CSS global (subindo um nível com '..')

export const metadata = {
  title: "Overlay OBS",
  description: "Widget transparente para stream",
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-transparent text-white overflow-hidden">
        {/* Estilos em linha para forçar a transparência absoluta.
            O '!important' garante que sobrescreve qualquer regra do globals.css 
        */}
        <style>{`
          html, body {
            background: transparent !important;
            background-color: rgba(0,0,0,0) !important;
            background-image: none !important;
          }
          
          /* Remove o efeito de neve global (pseudo-elemento body::before) */
          body::before {
            display: none !important;
            content: none !important;
          }
        `}</style>
        
        {/* Renderiza APENAS o conteúdo da página, sem Navbar ou AuthProvider */}
        {children}
      </body>
    </html>
  );
}