// app/(site)/redes/page.tsx
import { Header } from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { SocialFeed } from "@/app/components/portfolio/SocialFeed";

export default function RedesPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-20 flex-grow">
        <SocialFeed />
      </div>
      <Footer />
    </main>
  );
}