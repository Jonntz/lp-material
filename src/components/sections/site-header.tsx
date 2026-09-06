import Image from "next/image";

import fotoLp from "@/assets/foto-lp.jpg";
import novoLogo from "@/assets/novo-logo.png";
import { SITE } from "@/config/site";

/**
 * Topo da página: logo do partido, número, nome e a foto de campanha.
 * O formulário do hero é montado à parte, em `page.tsx`.
 */
export function SiteHeader() {
  return (
    <header id="inicio" className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 pb-2 text-center sm:pt-12">
        <Image
          src={novoLogo}
          alt={SITE.party}
          className="mx-auto h-8 w-auto sm:h-11"
          sizes="(min-width: 640px) 11rem, 8rem"
          priority
        />
        <p className="mt-5 text-[0.68rem] font-bold tracking-[0.34em] text-accent uppercase sm:text-sm">
          {SITE.role}
        </p>
        {/*
          `leading-[0.82]` deixa a caixa de linha menor que os glifos, e as
          ascendentes do Neo Sans transbordam ~9,5% do tamanho da fonte para
          cima e ~6% para baixo — o suficiente para cobrir o kicker e o nome.
          O padding em `em` compensa isso e continua valendo em qualquer
          breakpoint, já que escala junto com a fonte.
        */}
        <p className="font-display text-[24vw] leading-[0.82] font-black tracking-tighter text-foreground pt-[0.1em] pb-[0.07em] sm:text-[9rem] lg:text-[11rem]">
          {SITE.number}
        </p>
        <p className="mt-2 font-display text-lg font-black tracking-[0.14em] text-primary uppercase sm:text-2xl">
          {SITE.candidate}
        </p>
      </div>

      <div className="mx-auto mt-6 w-full max-w-5xl px-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-ink-soft">
          <Image
            src={fotoLp}
            alt={`${SITE.candidate}, candidato a ${SITE.role} por ${SITE.stateName}`}
            className="block h-auto w-full object-contain"
            sizes="(min-width: 1024px) 64rem, 100vw"
            placeholder="blur"
            priority
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </header>
  );
}
