import { cn } from "@/lib/utils";

type BrandBandsProps = {
  /** Altura da faixa. `thin` divide seções; `thick` fecha um bloco. */
  size?: "thin" | "thick";
  className?: string;
};

/**
 * Faixa diagonal com as seis cores do manual.
 *
 * É o grafismo que aparece na página de paleta e na peça conceito — a forma
 * mais direta de a marca aparecer inteira sem encher a página de cor.
 * Puramente decorativa: `aria-hidden`, sem texto, invisível para leitor de tela.
 */
export function BrandBands({ size = "thin", className }: BrandBandsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "brand-bands w-full",
        size === "thin" ? "h-2 sm:h-2.5" : "h-4 sm:h-5",
        className,
      )}
    />
  );
}
