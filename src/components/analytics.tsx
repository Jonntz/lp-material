import Script from "next/script";

import { ANALYTICS } from "@/config/analytics";

/**
 * Google Tag Manager + Meta Pixel.
 *
 * Os dois usam `strategy="afterInteractive"`: entram depois que a página já
 * hidratou, que é o que os dois fornecedores recomendam e o que mantém o
 * caminho crítico livre. Nenhum dos dois precisa rodar antes da primeira
 * pintura — medir uma página que ninguém consegue ler ainda não serve para nada.
 *
 * A CSP libera os domínios necessários; a lista vive em `src/config/analytics.ts`
 * e é derivada dos mesmos IDs, então ligar/desligar uma ferramenta ajusta a CSP
 * sozinho. Ver `next.config.ts`.
 */
export function AnalyticsScripts() {
  return (
    <>
      {ANALYTICS.gtmId ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${ANALYTICS.gtmId}');`}
        </Script>
      ) : null}

      {ANALYTICS.metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${ANALYTICS.metaPixelId}');
fbq('track', 'PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/**
 * Fallbacks sem JavaScript. Vão **logo após a abertura do `<body>`**, como os
 * dois fornecedores exigem.
 *
 * `title` no iframe e `alt=""` no pixel existem para o leitor de tela: sem eles
 * o iframe é anunciado sem nome e a imagem de 1×1 vira ruído.
 */
export function AnalyticsNoScript() {
  return (
    <>
      {ANALYTICS.gtmId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${ANALYTICS.gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      ) : null}

      {ANALYTICS.metaPixelId ? (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${ANALYTICS.metaPixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ) : null}
    </>
  );
}
