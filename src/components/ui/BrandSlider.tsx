import Image from "next/image";

const TOTAL_BRANDS = 29;
const brands = Array.from({ length: TOTAL_BRANDS }, (_, i) => ({
  id: i + 1,
  src: `/images/brands/brand-${i + 1}.png`,
}));
const loop = [...brands, ...brands];

export function BrandSlider() {
  return (
    <section className="overflow-hidden border-t border-neutral-100 bg-white py-8 md:py-12">
      <div className="container mx-auto mb-6 px-6 text-center md:mb-8">
        <h2 className="font-heading text-lg font-medium uppercase tracking-[0.3em] text-neutral-800 md:text-xl">
          Наші Бренди
        </h2>
        <div className="mx-auto mt-2 h-[1px] w-12 bg-[#C5A059] md:h-[1.5px] md:w-16" />
      </div>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-marquee">
          {loop.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex h-28 w-40 flex-shrink-0 items-center justify-center md:h-36"
            >
              <div className="relative h-14 w-28 md:h-16 md:w-32 lg:h-20 lg:w-40">
                <Image
                  src={brand.src}
                  alt=""
                  fill
                  loading="lazy"
                  decoding="async"
                  className="object-contain"
                  sizes="160px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
