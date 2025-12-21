import { Badge } from "@/components/ui/badge"; 
// Remova o import de Image do next para evitar erro 400 se a imagem não existir, use img tag normal para teste

export function BrandLogos() {
  const brands = [
    // Deixei apenas exemplos seguros. Adicione suas imagens na pasta public depois.
    {
      name: "Parceiro 1",
      logo: "/vercel.svg", // Imagem que com certeza existe no Next.js
      url: "#",
      coupon: "DESCONTO10", 
    },
    {
      name: "Parceiro 2",
      logo: "/next.svg",
      url: "#",
      coupon: null,
    },
  ];

  return (
    <section id="partners" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-12 text-gray-600 uppercase tracking-wider font-semibold">
          Parceiros
        </h2>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          {brands.map((brand) => (
            <a
              key={brand.name}
              href={brand.url}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all w-48 h-40"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-12 w-auto object-contain mb-4"
              />
              {brand.coupon && (
                <Badge variant="destructive" className="uppercase text-xs">
                  {brand.coupon}
                </Badge>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}