import { cn } from "@/lib/utils";

/**
 * Cor da numeração de cada card, ciclando pela paleta do manual.
 *
 * Só entram tons que passam em AA sobre o card `#073B4F`, onde eles vivem:
 * laranja-texto 4.53:1 · lima 4.59:1 · amarelo 7.66:1. O verde `#1CA638`
 * ficou de fora porque dá 3.75:1 ali — ele serve como preenchimento, não
 * como texto pequeno.
 */
const NUMBER_COLORS = [
  "text-primary-text",
  "text-brand-lima",
  "text-accent",
  "text-primary-text",
] as const;

const BENEFITS = [
  {
    title: "Artes prontas para redes",
    description:
      "Posts, stories e capas com a identidade da campanha. Você baixa e publica no mesmo minuto.",
  },
  {
    title: "Textos e roteiros de WhatsApp",
    description:
      "Mensagens testadas para convencer grupo de família, bairro e igreja sem soar panfleto.",
  },
  {
    title: "Panfleto digital e adesivos",
    description:
      "Arquivos em alta para imprimir na sua cidade ou compartilhar direto do celular.",
  },
  {
    title: "Guia do voto 3055",
    description:
      "Como explicar o número, a proposta e a diferença do Novo em menos de um minuto.",
  },
] as const;

/** Os quatro itens do kit de campanha. Âncora `#material` do menu. */
export function Benefits() {
  return (
    <section
      id="material"
      className="border-y border-border bg-ink-soft py-14 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <h2 className="font-display text-2xl font-black sm:text-4xl">
          O que você recebe hoje
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Um pacote enxuto e direto ao ponto, feito para quem quer resultado e
          não enfeite.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit, index) => (
            <article
              key={benefit.title}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/60 sm:p-6"
            >
              <span
                className={cn(
                  "font-display text-sm font-black",
                  NUMBER_COLORS[index % NUMBER_COLORS.length],
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-lg font-black sm:text-xl">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
