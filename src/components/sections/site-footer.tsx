import Image from "next/image";
import Link from "next/link";

import matheusLogo from "@/assets/logo/matheus-3055-cor.png";
import novoLogo from "@/assets/novo-logo.png";
import { activeSocialLinks } from "@/config/social";
import { LEGAL, SITE } from "@/config/site";

/**
 * Rodapé: marca, redes sociais (só as com link preenchido em
 * `src/config/social.ts`) e os avisos eleitoral e de LGPD.
 *
 * O `pb-28` no mobile reserva espaço para a barra fixa de CTA.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink-soft pb-28 sm:pb-12">
      <div className="mx-auto w-full max-w-4xl px-5 py-12 text-center">
        <Image
          src={novoLogo}
          alt={SITE.party}
          className="mx-auto h-8 w-auto sm:h-10"
          sizes="(min-width: 640px) 10rem, 8rem"
          loading="lazy"
        />
        <Image
          src={matheusLogo}
          alt={`${SITE.candidate}, ${SITE.role} — ${SITE.number}`}
          className="mx-auto mt-7 h-auto w-52 sm:w-60"
          sizes="(min-width: 640px) 15rem, 13rem"
          loading="lazy"
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Material de apoio gratuito · {SITE.stateName}
        </p>

        {activeSocialLinks.length > 0 ? (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {activeSocialLinks.map(({ id, label, icon: Icon, href }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} de ${SITE.candidate}`}
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
        ) : null}

        <Link
          href="/privacidade"
          className="mt-6 inline-block rounded px-2 py-1.5 text-sm text-muted-foreground underline underline-offset-4 transition hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Política de Privacidade
        </Link>

        <p className="mt-8 font-display text-sm leading-relaxed font-black text-primary-text uppercase sm:text-base">
          {LEGAL.electoralNotice}
        </p>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed font-semibold text-foreground">
          {LEGAL.lgpdNotice}
        </p>
      </div>
    </footer>
  );
}
