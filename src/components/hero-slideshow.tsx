"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useState } from "react";

import { PauseIcon, PlayIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Intervalo entre as fotos. */
const INTERVAL_MS = 5000;

/** Quanto dura a transição entre uma foto e a seguinte. */
const FADE_MS = 920;

/** Enquadramento padrão: bom para retrato em que o rosto está no terço superior. */
const DEFAULT_OBJECT_POSITION = "center 18%";

export type HeroSlide = {
  src: StaticImageData;
  /** Descreve a cena; entra no `alt` só enquanto a foto está visível. */
  alt: string;
  /**
   * `object-position` desta foto, quando o padrão não serve.
   *
   * O padrão assume o rosto no terço superior do quadro. Em foto onde a pessoa
   * está mais embaixo — sentada, ou pequena dentro de uma cena ampla — ela
   * escorregaria para fora do corte. Ver `src/config/hero-slides.ts`.
   */
  objectPosition?: string;
};

type HeroSlideshowProps = {
  slides: readonly HeroSlide[];
  className?: string;
};

/**
 * Apresentação de slides da foto principal.
 *
 * Três decisões que valem explicação:
 *
 * 1. **Proporção fixa.** As fotos vêm em formatos diferentes — `foto-lp` é
 *    paisagem 3:2 e a maioria é retrato 2:3. Sem uma caixa de proporção fixa, o
 *    layout saltaria a cada troca e o CLS iria pro alto.
 *
 *    O corte é 3:2 no desktop, e o `object-position` padrão é `center 18%`:
 *    nos retratos 2:3 isso mostra de 10% a 55% da foto, deixando o rosto no
 *    terço superior. Fotos em que a pessoa aparece mais embaixo trazem o
 *    próprio valor — ver `objectPosition` em `src/config/hero-slides.ts`.
 *    No celular a caixa é 4:5 e os retratos quase não perdem nada.
 *
 * 2. **Carregamento progressivo.** Só a primeira foto entra no HTML inicial,
 *    com `priority` — ela é o LCP da página. As seguintes são montadas uma de
 *    cada vez, sempre uma à frente da que está na tela. Montar as seis de uma
 *    vez faria o navegador baixar vários megabytes antes da primeira pintura.
 *
 * 3. **Dá para pausar.** A WCAG 2.2.2 exige um jeito de parar qualquer conteúdo
 *    que se atualize sozinho por mais de 5 segundos — e aqui são 5. Quem pediu
 *    `prefers-reduced-motion: reduce` começa com a apresentação já parada.
 */
export function HeroSlideshow({ slides, className }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(1);
  const [paused, setPaused] = useState(false);
  /** `null` até sabermos a preferência do sistema, para não decidir errado no SSR. */
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  const single = slides.length <= 1;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReducedMotion(query.matches);
      if (query.matches) setPaused(true);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  /**
   * Monta a segunda foto pouco depois da primeira pintura. Sem isso, a primeira
   * transição pegaria a imagem ainda baixando e apareceria um vazio.
   */
  useEffect(() => {
    if (single) return;
    const timer = window.setTimeout(() => setMounted((m) => Math.max(m, 2)), 2000);
    return () => window.clearTimeout(timer);
  }, [single]);

  const advance = useCallback(() => {
    setIndex((current) => {
      const next = (current + 1) % slides.length;
      // deixa a próxima já montada antes de ela precisar aparecer
      setMounted((m) => Math.max(m, Math.min(slides.length, next + 2)));
      return next;
    });
  }, [slides.length]);

  // `advance` só muda se a quantidade de fotos mudar, então o intervalo não é
  // recriado a cada troca — ele usa a forma funcional do `setIndex`.
  useEffect(() => {
    if (single || paused || reducedMotion === null) return;
    const timer = window.setInterval(advance, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [advance, single, paused, reducedMotion]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-ink-soft",
        "aspect-[4/5] sm:aspect-[3/2]",
        className,
      )}
    >
      {slides.slice(0, mounted).map((slide, i) => {
        const active = i === index;
        return (
          <Image
            key={slide.src.src}
            src={slide.src}
            // Só a foto visível é anunciada; as outras somem para o leitor de tela.
            alt={active ? slide.alt : ""}
            aria-hidden={active ? undefined : true}
            fill
            className={cn(
              "object-cover transition-opacity ease-in-out",
              active ? "opacity-100" : "opacity-0",
            )}
            style={{
              transitionDuration: `${FADE_MS}ms`,
              objectPosition: slide.objectPosition ?? DEFAULT_OBJECT_POSITION,
            }}
            sizes="(min-width: 1024px) 64rem, 100vw"
            placeholder="blur"
            priority={i === 0}
          />
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent" />

      {single ? null : (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-full border border-border bg-ink/80 text-foreground backdrop-blur transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {paused ? (
            <PlayIcon className="size-4" aria-hidden="true" />
          ) : (
            <PauseIcon className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {paused ? "Retomar apresentação de fotos" : "Pausar apresentação de fotos"}
          </span>
        </button>
      )}
    </div>
  );
}
