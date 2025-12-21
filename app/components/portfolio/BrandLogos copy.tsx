import Image from "next/image";
import { Badge } from "@/components/ui/badge"; // 1. Importe o componente Badge

export function BrandLogos() {
  // 2. Adicione o campo "coupon" (pode ser string ou null/undefined)
  const brands = [
    {
      name: "BIOTONICO FONTORA",
      logo: "/logo-techcorp.png",
      url: "",
      coupon: "FOME10", // Cupom de exemplo
    },
    {
      name: "VIAGRA LEVANTA MORTO",
      logo: "/logo-gamezone.svg",
      url: "",
      coupon: "DURO100", // Cupom de exemplo
    },
    {
      name: "PIPOCA YOKI",
      logo: "/logo-streampro.png",
      url: "",
      coupon: null, // Sem cupom
    },
    {
      name: "PAMPERS",
      logo: "/pampers.png",
      url: "",
      coupon: "DIGI15", // Cupom de exemplo
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-12 text-gray-600 uppercase tracking-wider">
          Marcas que Confiam
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {brands.map((brand) => (
            // 3. O '<a>' agora tem 'flex-col' para empilhar os itens
            <a
              key={brand.name}
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-4 bg-white rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all h-40" // Aumentei a altura para h-40
            >
              {/* Este div centraliza o logo e o faz ocupar o espaço disponível */}
              <div className="flex-grow flex items-center justify-center">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={150}
                  height={64}
                  className="object-contain"
                />
              </div>

              {/* 4. Renderização condicional do Cupom */}
              {brand.coupon && (
                <div className="flex justify-center mt-2">
                  <Badge
                    variant="destructive"
                    className="uppercase"
                  >
                    Cupom: {brand.coupon}
                  </Badge>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}