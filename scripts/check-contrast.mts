/**
 * Valida os pares de contraste da paleta da identidade visual contra a WCAG 2.1.
 *
 * Lê os hex direto de `src/app/globals.css` (bloco `:root`), então se alguém mexer
 * nas cores o script acusa na hora. Roda com `pnpm check:contrast`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS_PATH = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);

/** Pares que precisam passar, com o mínimo exigido e onde são usados. */
const PAIRS: ReadonlyArray<{
  fg: string;
  bg: string;
  min: number;
  usage: string;
}> = [
  // O lima aguenta ser texto em qualquer superfície do site — foi por isso que
  // o token extra `--primary-text`, criado quando a cor de ação era o laranja,
  // pôde ser retirado.
  { fg: "primary", bg: "background", min: 4.5, usage: "texto de destaque" },
  { fg: "primary", bg: "card", min: 4.5, usage: "texto de destaque sobre card" },
  { fg: "primary", bg: "ink", min: 4.5, usage: "texto de destaque sobre ink" },
  {
    fg: "primary-foreground",
    bg: "primary",
    min: 4.5,
    usage: "texto do botão CTA",
  },
  { fg: "foreground", bg: "background", min: 4.5, usage: "texto corrente" },
  {
    fg: "muted-foreground",
    bg: "background",
    min: 4.5,
    usage: "texto secundário",
  },
  { fg: "foreground", bg: "card", min: 4.5, usage: "texto sobre card" },
  {
    fg: "muted-foreground",
    bg: "card",
    min: 4.5,
    usage: "texto secundário sobre card",
  },
  { fg: "accent", bg: "background", min: 4.5, usage: "badges e números" },
  {
    fg: "accent-foreground",
    bg: "accent",
    min: 4.5,
    usage: "texto sobre amarelo",
  },
  {
    fg: "secondary-foreground",
    bg: "secondary",
    min: 4.5,
    usage: "texto sobre faixa teal",
  },
  { fg: "foreground", bg: "ink-soft", min: 4.5, usage: "texto sobre ink-soft" },
  {
    fg: "muted-foreground",
    bg: "ink-soft",
    min: 4.5,
    usage: "texto secundário sobre ink-soft",
  },
  { fg: "ring", bg: "background", min: 3, usage: "anel de foco (não-texto)" },
  { fg: "border", bg: "card", min: 1.2, usage: "borda decorativa sobre card" },
  {
    fg: "control-border",
    bg: "ink",
    min: 3,
    usage: "borda de input (WCAG 1.4.11)",
  },
  {
    fg: "control-border",
    bg: "card",
    min: 3,
    usage: "borda de checkbox (WCAG 1.4.11)",
  },
  {
    fg: "control-border",
    bg: "background",
    min: 3,
    usage: "borda de controle sobre o fundo",
  },
  {
    fg: "destructive",
    bg: "background",
    min: 4.5,
    usage: "mensagem de erro",
  },
  {
    // os erros de validação são renderizados dentro do card do formulário
    fg: "destructive",
    bg: "card",
    min: 4.5,
    usage: "mensagem de erro no card",
  },
  // A numeração dos cards e as estatísticas ciclam pela paleta do manual.
  // Cada tom precisa se sustentar sobre a superfície em que aparece.
  {
    fg: "brand-verde",
    bg: "card",
    min: 3,
    usage: "verde como preenchimento",
  },
  {
    fg: "accent",
    bg: "card",
    min: 4.5,
    usage: "numeração 03 sobre card",
  },
];

function readTokens(): Map<string, string> {
  const css = readFileSync(CSS_PATH, "utf8");
  const rootStart = css.indexOf(":root {");
  if (rootStart === -1) throw new Error("bloco :root não encontrado");
  const rootEnd = css.indexOf("\n}", rootStart);
  const block = css.slice(rootStart, rootEnd);

  const tokens = new Map<string, string>();
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    tokens.set(match[1], match[2]);
  }
  return tokens;
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Luminância relativa — WCAG 2.1, 1.4.3. */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const tokens = readTokens();
let failed = 0;

console.log("\nContraste da paleta — Matheus Biancardine 3055\n");

for (const pair of PAIRS) {
  const fg = tokens.get(pair.fg);
  const bg = tokens.get(pair.bg);

  if (!fg || !bg) {
    console.error(`  ?  --${pair.fg} sobre --${pair.bg}: token não encontrado`);
    failed += 1;
    continue;
  }

  const ratio = contrast(fg, bg);
  const ok = ratio >= pair.min;
  if (!ok) failed += 1;

  const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA " : ratio >= 3 ? "AA+" : "—  ";
  console.log(
    `  ${ok ? "✓" : "✗"}  ${ratio.toFixed(2).padStart(5)}:1  ${level}  ` +
      `--${pair.fg} sobre --${pair.bg}`.padEnd(46) +
      `${pair.usage}${ok ? "" : `  (mínimo ${pair.min})`}`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} par(es) abaixo do mínimo exigido.\n`);
  process.exit(1);
}

console.log(`\nTodos os ${PAIRS.length} pares passaram.\n`);
