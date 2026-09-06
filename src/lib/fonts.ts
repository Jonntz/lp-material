import { Barlow } from "next/font/google";
import localFont from "next/font/local";

/**
 * Tipografia da campanha.
 *
 * Display: **Neo Sans Std**, a fonte da identidade visual (Monotype, comercial).
 * Os `.otf` originais estão em `src/fonts/`; o que o site carrega são versões
 * `.woff2` com subset latin + latin-ext geradas a partir deles — ~15 KB por peso
 * em vez de ~70 KB. Ver `src/fonts/README.md` para o comando de regeneração.
 *
 * Só os pesos realmente usados são declarados. O projeto não usa itálico em
 * nenhum lugar, então as variantes itálicas ficam de fora do bundle.
 */
const neoSans = localFont({
  src: [
    { path: "../fonts/NeoSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/NeoSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/NeoSans-Bold.woff2", weight: "700", style: "normal" },
    // `font-black` (24 usos) é o peso dominante do layout: o "3055", os títulos
    // e os CTAs. Black é o que mais se aproxima do peso do site de referência;
    // se quiser o número ainda mais forte, existe "Neo Sans Std Ultra.otf".
    { path: "../fonts/NeoSans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
});

/** Fonte de títulos, números e CTAs. */
export const displayFont = neoSans;

/** Fonte de texto corrido. */
export const bodyFont = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

/** Classe a aplicar no <html>. */
export const fontVariables = `${displayFont.variable} ${bodyFont.variable}`;
