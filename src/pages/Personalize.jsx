import { useEffect, useState } from "react";
import { getPersonalizePage } from "../api/pages";
import { mergePage, personalizeDefaults } from "../content/pagesContent";
import { LookPair } from "../components/common/Hotspots";
import { FaqList, FullWidthPage, HowToSteps, PageHero, ProductRail, SplitFeature, StyleRows, Wide } from "../components/pages/PageSections";

/*
  /personalize — "Personalization Guide" page.
  Text, images, hotspots, steps, styles and FAQ: WP Admin → Personalize Page.
  Products, prices and photos: WooCommerce.
*/
export function Personalize() {
  const [c, setC] = useState(null);

  useEffect(() => {
    let alive = true;
    getPersonalizePage()
      .then((wp) => alive && setC(mergePage(personalizeDefaults, wp)))
      .catch((e) => {
        console.warn("Personalize page settings not loaded, using defaults:", e?.message);
        if (alive) setC(personalizeDefaults);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!c) {
    return (
      <FullWidthPage>
        <div className="h-[46vh] min-h-[340px] bg-[#EFE9E1] animate-pulse" />
      </FullWidthPage>
    );
  }

  return (
    <FullWidthPage className="pb-10">
      <PageHero {...c.hero} />
      <SplitFeature content={c.intro} />
      <SplitFeature content={c.gifts} reverse />
      <Wide>
        <ProductRail
          title={c.products.title}
          linkLabel={c.products.linkLabel}
          linkTo={c.products.linkTo}
          source={c.products}
        />
        <LookPair looks={c.looks} className="py-8" />
        <HowToSteps {...c.howTo} />
      </Wide>
      <StyleRows {...c.styles} /> 
      <Wide>
        <FaqList {...c.faq} />
      </Wide>
    </FullWidthPage>
  );
}