import { cn } from "@/lib/utils";

import Image from "next/image";

import fotoLp from "@/assets/foto-lp.jpg";
import { SITE } from "@/config/site";

/**
 * Uma cor do manual por estatística. Aqui o texto é 24px+ (grande pela WCAG,
 * que pede 3:1), então o verde `#1CA638` também cabe — ele só não serve em
 * texto pequeno.
 */
const STAT_COLORS = [
  "text-accent",
  "text-brand-lima",
  "text-primary",
] as const;

const STATS = [
  { value: String(SITE.cityCount), label: "cidades mineiras no radar" },
  { value: "1º", label: "fundador da Juventude do Novo" },
  { value: SITE.number, label: "o número de Minas em Brasília" },
] as const;

/** Biografia do candidato. Âncora `#candidato` do menu. */
export function CandidateBio() {
  return (
    <section
      id="candidato"
      className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20"
    >
      <span className="text-[0.7rem] font-bold tracking-[0.24em] text-primary-text uppercase">
        Quem está pedindo seu voto
      </span>
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-border bg-ink-soft">
          <Image
            src={fotoLp}
            alt={`${SITE.candidate} em retrato de campanha`}
            className="block h-auto w-full"
            sizes="(min-width: 1024px) 36rem, 100vw"
            placeholder="blur"
            loading="lazy"
          />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black sm:text-4xl">
            {SITE.candidate}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Fundador da Juventude do {SITE.party}, ex-assessor do governador
            Mateus Simões e ex-diretor de Políticas para a Juventude. Trajetória
            construída dentro da gestão pública, aprendendo onde o dinheiro do
            mineiro é desperdiçado e como devolver esse dinheiro para quem
            produz.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A candidatura nasce de uma convicção simples: Minas tem{" "}
            {SITE.cityCount} cidades e nenhuma delas pode continuar sendo
            lembrada apenas em ano eleitoral.
          </p>
          <dl className="mt-7 grid grid-cols-3 gap-3">
            {STATS.map((stat, index) => (
              <div
                key={stat.value}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <dt
                  className={cn(
                    "font-display text-2xl font-black sm:text-3xl",
                    STAT_COLORS[index % STAT_COLORS.length],
                  )}
                >
                  {stat.value}
                </dt>
                <dd className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
