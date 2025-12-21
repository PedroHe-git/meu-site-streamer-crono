// app/(site)/dashboard/layout.tsx
import { Navbar } from "@/app/components/Navbar"; // A Navbar antiga do sistema

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Aqui sim, mostramos a barra de ferramentas do sistema */}
      <Navbar /> 
      
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}