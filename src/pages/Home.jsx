import { useEffect, useMemo } from "react";
import { useHomeData } from "../hooks/useHomeData";
import { HomeHero } from "../components/home/HomeHero";
import { CloudHero } from "../components/home/CloudHero";
import { SleepSteps } from "../components/home/SleepSteps";
import { ProductTabsSection } from "../components/home/ProductTabsSection";
import { BestsellerCategories, BenefitTrio, ScienceCarousel } from "../components/home/CategorySections";
import { ParallaxBanner, StatsSplit, UgcStrip } from "../components/home/BannerSections";
import { QuoteStrip, ReviewsCarousel } from "../components/home/ReviewSections";
import { ShopTheLook } from "../components/home/ShopTheLook";
import { useImagePicks, useMeasured } from "../components/home/primitives";

export function Home() {
  // content = WP Admin → Home Page (images + text), with defaults from content/homeContent.js
  const { loading, error, categories, featured, popular, stats, content: c } = useHomeData();

  // The page breaks out of the Layout's max-width container (full width).
  // Clip the tiny horizontal overflow that 100vw causes when a scrollbar is visible.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflowX;
    html.style.overflowX = "clip";
    return () => {
      html.style.overflowX = prev;
    };
  }, []);

  // Pool of real product images used wherever a marketing image isn't set in homeContent
  const pool = useMemo(() => {
    const seen = new Set();
    const main = [];
    const extra = [];
    for (const p of [...featured, ...popular]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      (p.images || []).forEach((img, i) => (i === 0 ? main : extra).push(img.src));
    }
    return { main, all: [...extra, ...main] };
  }, [featured, popular]);

  // Big slots (hero, banners, stats) use your homeContent images first,
  // otherwise the largest store images. Each image is measured: wide ones fill
  // the slot, small ones are shown sharp as a card (never stretched/pixelated).
  const picks = useImagePicks([...categories.map((cat) => cat.image?.src), ...pool.all, ...pool.main], 4);
  const own = {
    hero: useMeasured(c.hero.image),
    bannerOne: useMeasured(c.bannerOne.image),
    stats: useMeasured(c.statsSplit.image),
    bannerTwo: useMeasured(c.bannerTwo.image),
  };
  const big = {
    hero: own.hero || picks[0] || null,
    bannerOne: own.bannerOne || picks[1] || picks[0] || null,
    stats: own.stats || picks[2] || picks[0] || null,
    bannerTwo: own.bannerTwo || picks[3] || picks[1] || picks[0] || null,
  };

  if (loading) return <FullWidth><HomeSkeleton /></FullWidth>;

  if (error && !featured.length) {
    return (
      <div className="py-32 text-center text-[#5B6478]">
        We couldn't load the store right now. Please refresh the page.
      </div>
    );
  }

  return (
    <FullWidth>
      {/* WP Admin → Home Page → Hero → "Hero effect" */}
      {c.hero.effect === "classic" ? (
        <HomeHero content={c.hero} image={big.hero} stats={stats} />
      ) : (
        <CloudHero content={c.hero} image={big.hero} stats={stats} water={c.hero.effect !== "clouds"} />
      )}

      <ProductTabsSection content={c.productTabs} categories={categories} featured={featured} />

      <BestsellerCategories content={c.bestsellers} categories={categories} fallbackImages={pool.main} />

      <QuoteStrip press={c.press} />

      <SleepSteps content={c.sleepSteps} fallbackImages={pool.main} />

      <ParallaxBanner content={c.bannerOne} image={big.bannerOne} />

      <ScienceCarousel content={c.science} categories={categories} fallbackImages={pool.main} />

      <ShopTheLook content={c.shopTheLook} />

      <StatsSplit content={c.statsSplit} image={big.stats} stats={stats} />

      <ReviewsCarousel content={c.reviews} categories={categories} totalReviews={stats.totalReviews} />

      <ParallaxBanner content={c.bannerTwo} image={big.bannerTwo} />

      <BenefitTrio content={c.benefits} categories={categories} fallbackImages={pool.main} />

      <UgcStrip content={c.ugc} images={c.ugc.images.length ? c.ugc.images.map((img) => img.src || img) : pool.all.slice(0, 10)} />
    </FullWidth>
  );
}

// Spans the whole browser width even when the Layout wraps pages in a max-width container
function FullWidth({ children }) {
  return (
    <div
      className="bg-[#F6F1EA] text-[#1D2A4D] pb-4"
      style={{ width: "100vw", position: "relative", left: "50%", marginLeft: "-50vw" }}
    >
      {children}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse px-3 md:px-4 pt-3 md:pt-4">
      <div className="h-[72vh] min-h-[460px] max-h-[760px] rounded-[28px] bg-slate-100" />
      <div className="h-8 w-72 bg-slate-100 rounded mx-auto mt-20 mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1440px] mx-auto px-4 md:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
