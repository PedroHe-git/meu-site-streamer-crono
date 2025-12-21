// app/(site)/sobre/page.tsx
import { Header } from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { AboutSection } from "@/app/components/portfolio/AboutSection";
import { BrandLogos } from "@/app/components/portfolio/BrandLogos";

export default function SobrePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-20">
        <AboutSection />
        <BrandLogos />
      </div>
      <Footer />
    </main>
  );
}