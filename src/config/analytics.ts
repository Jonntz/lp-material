/**
 * IDs das ferramentas de medição.
 *
 * Deixar vazio desliga a ferramenta por completo — nenhum script é injetado e
 * nenhum `<noscript>` é renderizado. É assim que se testa a página sem sujar os
 * relatórios, e é assim que se desliga um pixel sem precisar mexer em código.
 *
 * Se um dia isso virar variável de ambiente, precisa ser `NEXT_PUBLIC_*`:
 * os dois scripts rodam no navegador.
 */
export const ANALYTICS = {
  /** Google Tag Manager — container que carrega GA4 e demais tags. */
  gtmId: "GTM-M498JLMC",
  /** Meta Pixel — conversões de anúncios do Facebook/Instagram. */
  metaPixelId: "1059089453243567",
} as const;

/** Domínios que a CSP precisa liberar por causa do que está ligado acima. */
export const ANALYTICS_CSP_HOSTS = {
  script: [
    ...(ANALYTICS.gtmId
      ? ["https://www.googletagmanager.com", "https://www.google-analytics.com"]
      : []),
    ...(ANALYTICS.metaPixelId ? ["https://connect.facebook.net"] : []),
  ],
  connect: [
    ...(ANALYTICS.gtmId
      ? [
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://analytics.google.com",
          // GA4 usa subdomínios regionais para os hits (region1, region2, …)
          "https://*.analytics.google.com",
          "https://*.google-analytics.com",
        ]
      : []),
    ...(ANALYTICS.metaPixelId
      ? ["https://connect.facebook.net", "https://www.facebook.com"]
      : []),
  ],
  img: [
    ...(ANALYTICS.gtmId
      ? ["https://www.googletagmanager.com", "https://www.google-analytics.com"]
      : []),
    // o pixel sem-JS do Meta é literalmente um <img>
    ...(ANALYTICS.metaPixelId ? ["https://www.facebook.com"] : []),
  ],
  /** O `<noscript>` do GTM é um iframe; sem isto a CSP o bloqueia. */
  frame: ANALYTICS.gtmId ? ["https://www.googletagmanager.com"] : [],
} as const;
