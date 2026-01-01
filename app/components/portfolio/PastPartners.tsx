import { getSponsors } from "@/lib/data";
import Image from "next/image";

export default async function PastPartners() {
  const pastPartners = await getSponsors(false); // false = inativos

  if (!pastPartners || pastPartners.length === 0) return null;

  return (
    <section className="py-16 bg-[#030303] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 opacity-80">
            Marcas que já estiveram com a gente
          </h3>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {pastPartners.map((partner) => (
            <div 
              key={partner.id}
              className="group relative flex items-center justify-center w-28 h-28 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
              title={partner.name}
            >
              <div className="relative w-14 h-14 opacity-30 group-hover:opacity-80 filter grayscale transition-all duration-300">
                {partner.imageUrl ? (
                  <Image 
                     src={partner.imageUrl} 
                     alt={partner.name} 
                     fill 
                     unoptimized={true}
                     className="object-contain" 
                  />
                ) : (
                  <span className="text-gray-600 font-bold text-xl">{partner.name[0]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}