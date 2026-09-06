import { Benefits } from "@/components/sections/benefits";
import { CandidateBio } from "@/components/sections/candidate-bio";
import { FinalCta } from "@/components/sections/final-cta";
import { HeroIntro } from "@/components/sections/hero-intro";
import { BrandBands } from "@/components/sections/brand-bands";
import { Manifesto } from "@/components/sections/manifesto";
import {
  MARQUEE_CREDENTIALS,
  MARQUEE_TOP,
  Marquee,
} from "@/components/sections/marquee";
import { MobileCtaBar } from "@/components/sections/mobile-cta-bar";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { SignupForm } from "@/components/signup-form";
import { SocialDrawer } from "@/components/social-drawer";
import { SocialRail } from "@/components/social-rail";
import { StructuredData } from "@/components/structured-data";
import { activeSocialLinks } from "@/config/social";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData sameAs={activeSocialLinks.map((link) => link.href)} />

      <a href="#cadastro" className="skip-link">
        Pular para o cadastro
      </a>

      <SocialDrawer />
      <SocialRail />

      <Marquee items={MARQUEE_TOP} speed="fast" />
      <BrandBands />

      <main>
        <SiteHeader />

        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-5 pt-8 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-12">
          <HeroIntro />
          <SignupForm idPrefix="hero" anchorId="cadastro" />
        </div>

        <Marquee items={MARQUEE_CREDENTIALS} variant="accent" />

        <Manifesto />
        <Benefits />
        <BrandBands size="thick" />
        <CandidateBio />

        <Marquee items={MARQUEE_CREDENTIALS} speed="fast" variant="soft" />

        <FinalCta>
          <SignupForm idPrefix="final" />
        </FinalCta>
      </main>

      <BrandBands />
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
