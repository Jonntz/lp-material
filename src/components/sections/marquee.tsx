import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";

/** Faixa do topo da página — curta e rápida. */
export const MARQUEE_TOP = [
  "Material de apoio gratuito",
  `${SITE.cityCount} cidades mineiras`,
  `${SITE.candidate} | ${SITE.role}`,
  `${SITE.party} · ${SITE.number}`,
] as const;

/** Faixa de credenciais — usada depois do hero e depois da bio. */
export const MARQUEE_CREDENTIALS = [
  `${SITE.cityCount} cidades mineiras alcançadas`,
  `Fundador da Juventude do ${SITE.party}`,
  "Ex-assessor do governador Mateus Simões",
  "Ex-diretor de Políticas para a Juventude",
  "Gestão pública com resultado, não com discurso",
  "Menos imposto, mais liberdade para Minas",
  "Juventude na linha de frente da política mineira",
  "Material de campanha pronto para usar hoje",
] as const;

type MarqueeProps = {
  /** Frases exibidas na faixa. O array é duplicado no DOM pelo componente. */
  items: readonly string[];
  /** `normal` = 32s por volta, `fast` = 22s. */
  speed?: "normal" | "fast";
  /** `primary` = faixa verde cheia; `soft` = faixa discreta sobre `ink-soft`. */
  variant?: "primary" | "soft";
};

/**
 * Faixa deslizante infinita.
 *
 * A trilha visual é duplicada (`[...items, ...items]`) porque o keyframe
 * `marquee-x` translada `-50%` — a segunda cópia entra em cena exatamente
 * quando a primeira sai. Ela é `aria-hidden`; o texto acessível fica num
 * `sr-only` para o leitor de tela ler as frases uma única vez.
 */
export function Marquee({
  items,
  speed = "normal",
  variant = "primary",
}: MarqueeProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "relative overflow-hidden py-3",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "border-y border-border bg-ink-soft text-foreground",
      )}
    >
      <div
        className={cn(
          "flex w-max",
          speed === "fast" ? "marquee-track-fast" : "marquee-track",
        )}
        aria-hidden="true"
      >
        {[...items, ...items].map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center gap-3 px-4 text-[0.72rem] font-bold tracking-[0.16em] uppercase sm:text-sm"
          >
            {item}
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                isPrimary ? "bg-primary-foreground/70" : "bg-primary",
              )}
            />
          </span>
        ))}
      </div>
      <span className="sr-only">{items.join(". ")}</span>
    </div>
  );
}
