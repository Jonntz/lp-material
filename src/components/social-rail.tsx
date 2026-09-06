import { activeSocialLinks } from "@/config/social";
import { SITE } from "@/config/site";

/**
 * Barra vertical fixa com as redes sociais, só em telas bem largas
 * (a partir de 2xl há margem suficiente fora do container de 72rem para ela
 * não cobrir o conteúdo).
 *
 * Em telas menores as mesmas redes aparecem no menu lateral e no rodapé.
 */
export function SocialRail() {
  if (activeSocialLinks.length === 0) return null;

  return (
    <aside
      aria-label="Redes sociais da campanha"
      className="fixed top-1/2 left-4 z-30 hidden -translate-y-1/2 2xl:block"
    >
      <ul className="flex flex-col gap-2">
        {activeSocialLinks.map(({ id, label, icon: Icon, href }) => (
          <li key={id}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} de ${SITE.candidate}`}
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground backdrop-blur transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Icon className="size-5" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
