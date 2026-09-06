import type { NextConfig } from "next";

import { ANALYTICS_CSP_HOSTS } from "./src/config/analytics";

const isDev = process.env.NODE_ENV === "development";

/** Junta as origens de uma diretiva, ignorando lista vazia. */
const directive = (name: string, ...values: (string | readonly string[])[]) =>
  [name, ...values.flat()].filter(Boolean).join(" ");

/**
 * Content-Security-Policy.
 *
 * Optamos por uma CSP **estática** em vez do padrão com nonce por middleware.
 * O nonce obriga o Next a renderizar toda página dinamicamente (a página precisa
 * ler um header por requisição), e esta landing é 100% estática — sob pico de
 * tráfego de campanha isso é uma troca ruim.
 *
 * `'unsafe-inline'` em script-src é exigido pelo payload de hidratação do Next.
 * O risco disso é baixo aqui porque a página **não renderiza nada vindo do
 * usuário**: os dados do formulário só saem (para a planilha) e nunca voltam
 * para o HTML. Tudo o mais fica fechado: nenhum script/estilo/imagem externo,
 * nenhum frame, `form-action` restrito à própria origem.
 *
 * As fontes são self-hosted pelo `next/font` no build, então não é preciso
 * liberar fonts.googleapis.com nem fonts.gstatic.com.
 *
 * As origens do GTM e do Meta Pixel são derivadas de `src/config/analytics.ts`:
 * esvaziar um ID lá fecha a CSP de novo, sem precisar lembrar de mexer aqui.
 * O `frame-src` deixou de ser `'none'` por causa do `<noscript>` do GTM, que é
 * um iframe; `frame-ancestors 'none'` continua valendo — ninguém embute a gente.
 */
const csp = [
  "default-src 'self'",
  directive(
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : [],
    ANALYTICS_CSP_HOSTS.script,
  ),
  "style-src 'self' 'unsafe-inline'",
  directive("img-src", "'self'", "data:", "blob:", ANALYTICS_CSP_HOSTS.img),
  "font-src 'self' data:",
  directive(
    "connect-src",
    "'self'",
    isDev ? ["ws:", "http://localhost:*"] : [],
    ANALYTICS_CSP_HOSTS.connect,
  ),
  "form-action 'self'",
  "frame-ancestors 'none'",
  directive(
    "frame-src",
    ANALYTICS_CSP_HOSTS.frame.length ? ANALYTICS_CSP_HOSTS.frame : "'none'",
  ),
  "object-src 'none'",
  "base-uri 'self'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    // Todas as imagens são importadas estaticamente de src/assets — nenhuma origem remota.
    remotePatterns: [],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
