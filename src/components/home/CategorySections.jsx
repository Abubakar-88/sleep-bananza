import { Link } from "react-router-dom";
import { decodeHtml } from "../../utils/decodeHtml";
import { Carousel, Container, Reveal, RevealGroup, RevealItem, SectionHeading, ink, muted, wcImgProps } from "./primitives";

const categoryLink = (c) => `/shop?category=${c.id}`;
// srcset-aware props: real category image if set, otherwise the fallback URL
const catImgProps = (c, fallback, sizes) => (c?.image?.src ? wcImgProps(c.image, sizes) : { src: fallback || "" });

// "Shop our bestsellers": category tiles
export function BestsellerCategories({ content, categories, fallbackImages }) {
  const list = categories.slice(0, 4);
  if (!list.length) return null;

  return (
    <section className="py-16 md:py-24 bg-[#EFE9E1]">
      <Container>
      <SectionHeading title={content.title} />
      <RevealGroup className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {list.map((c, i) => (
          <RevealItem key={c.id}>
            <Link to={categoryLink(c)} className="group block text-center">
              <div className="aspect-square overflow-hidden rounded-xl bg-[#E3DDD4]">
                <img
                  {...catImgProps(c, fallbackImages[i], "(min-width: 768px) 25vw, 50vw")}
                  alt={decodeHtml(c.name)}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <p className={`mt-3 text-sm font-medium ${ink}`}>{decodeHtml(c.name)}</p>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
      </Container>
    </section>
  );
}

// "Designed for rest": text on the left, tall dark category cards on the right
export function ScienceCarousel({ content, categories, fallbackImages }) {
  if (!categories.length) return null;

  return (
    <Container>
    <section className="py-16 md:py-24 grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] gap-8 md:gap-12 items-center">
      <Reveal>
        <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${ink}`}>{content.title}</h2>
        <p className={`mt-3 text-sm ${muted}`}>{content.text}</p>
        <Link to={content.linkTo} className={`inline-flex mt-5 text-sm font-semibold ${ink} hover:gap-3 gap-2 transition-all`}>
          {content.linkLabel} <span aria-hidden>→</span>
        </Link>
      </Reveal>

      <Reveal delay={0.1} className="min-w-0">
        <Carousel itemClassName="w-[62%] sm:w-[40%] lg:w-[calc(33.333%-11px)]" arrowTop="50%">
          {categories.map((c, i) => (
            <Link key={c.id} to={categoryLink(c)} className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-[#1D2A4D]">
              <img
                {...catImgProps(c, fallbackImages[i % (fallbackImages.length || 1)], "(min-width: 1024px) 22vw, 62vw")}
                alt=""
                decoding="async"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[900ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[#1D2A4D]/35 transition-colors duration-500 group-hover:bg-[#1D2A4D]/20" />
              <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold drop-shadow">
                {decodeHtml(c.name)}
              </span>
            </Link>
          ))}
        </Carousel>
      </Reveal>
    </section>
    </Container>
  );
}

// "Three ways to a deeper sleep": 3 image cards linked to the top 3 categories
export function BenefitTrio({ content, categories, fallbackImages }) {
  const items = content.items.slice(0, 3);
  return (
    <Container>
    <section className="py-16 md:py-24">
      <SectionHeading title={content.title} subtitle={content.subtitle} />
      <RevealGroup className="mt-10 grid md:grid-cols-3 gap-5">
        {items.map((b, i) => {
          const cat = categories[i];
          return (
            <RevealItem key={b.title}>
              <Link to={cat ? categoryLink(cat) : "/shop"} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E3E7F5]">
                  <img
                    {...catImgProps(cat, fallbackImages[i], "(min-width: 768px) 33vw, 100vw")}
                    alt=""
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 text-white text-2xl font-semibold drop-shadow-md">{b.title}</span>
                </div>
                <p className={`mt-3 text-sm ${muted}`}>{b.text}</p>
                <span className={`inline-flex mt-2 text-sm font-semibold ${ink} gap-2 group-hover:gap-3 transition-all`}>
                  {b.linkLabel} <span aria-hidden>→</span>
                </span>
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
    </Container>
  );
}