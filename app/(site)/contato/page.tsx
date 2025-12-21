// app/(site)/contato/page.tsx
import  Header  from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { ContactSection } from "@/app/components/portfolio/ContactSection";

export default function ContatoPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-20 flex-grow flex items-center">
        <ContactSection />
      </div>
      <Footer />
    </main>
  );
}