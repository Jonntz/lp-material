import { SITE } from "@/config/site";

/**
 * JSON-LD (Person + WebSite) para os buscadores entenderem quem é o candidato
 * e qual é o site oficial da campanha.
 *
 * O `<script type="application/ld+json">` é permitido pela CSP porque
 * `script-src` já libera inline; não é executável, é só dado estruturado.
 */
export function StructuredData({ sameAs }: { sameAs: readonly string[] }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE.url}/#candidato`,
        name: SITE.candidateLegalName,
        alternateName: SITE.candidate,
        jobTitle: `Candidato a ${SITE.role}`,
        description: SITE.description,
        memberOf: { "@type": "PoliticalParty", name: SITE.party },
        homeLocation: {
          "@type": "AdministrativeArea",
          name: SITE.stateName,
          addressCountry: "BR",
        },
        url: SITE.url,
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "pt-BR",
        about: { "@id": `${SITE.url}/#candidato` },
        publisher: { "@id": `${SITE.url}/#candidato` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON gerado por nós a partir de constantes — sem entrada de usuário.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
