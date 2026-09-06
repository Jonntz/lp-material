/**
 * Gera `src/data/mg-cities.ts` com os municípios de Minas Gerais.
 *
 * Uso: `pnpm gen:cities`
 *
 * Tenta três fontes, em ordem de preferência. A primeira que responder com uma
 * lista plausível vence:
 *   1. IBGE — fonte oficial, nomes já acentuados e em caixa mista.
 *   2. kelvins/municipios-brasileiros (GitHub raw) — mesmo conteúdo, útil quando
 *      o DNS do IBGE não resolve. O arquivo vem com BOM UTF-8.
 *   3. BrasilAPI — último recurso: devolve os nomes em CAIXA ALTA.
 *
 * Minas Gerais tem 853 municípios. Se a contagem divergir, avisamos alto e claro
 * mas seguimos em frente (a lista pode mudar por lei, e travar o build por isso
 * seria pior do que gerar com um aviso).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_COUNT = 853;
const FETCH_TIMEOUT_MS = 20_000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(scriptDir, "..", "src", "data", "mg-cities.ts");

type Source = {
  /** Rótulo curto, gravado no cabeçalho do arquivo gerado. */
  label: string;
  url: string;
  /** Extrai a lista de nomes do JSON bruto da fonte. */
  extract: (payload: unknown) => string[];
  /** Fontes que devolvem nomes em caixa alta merecem um aviso. */
  uppercase?: boolean;
};

const SOURCES: readonly Source[] = [
  {
    label: "IBGE (servicosdados.ibge.gov.br/api/v1/localidades)",
    url: "https://servicosdados.ibge.gov.br/api/v1/localidades/estados/MG/municipios",
    extract: (payload) => pluckNames(payload, "nome"),
  },
  {
    label: "kelvins/municipios-brasileiros (GitHub raw)",
    url: "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json",
    extract: (payload) => {
      if (!Array.isArray(payload)) return [];
      const mg = payload.filter(
        (item): item is Record<string, unknown> =>
          isRecord(item) && Number(item.codigo_uf) === 31,
      );
      return pluckNames(mg, "nome");
    },
  },
  {
    label: "BrasilAPI (brasilapi.com.br/api/ibge/municipios/v1/MG)",
    url: "https://brasilapi.com.br/api/ibge/municipios/v1/MG",
    extract: (payload) => pluckNames(payload, "nome"),
    uppercase: true,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pluckNames(payload: unknown, key: string): string[] {
  if (!Array.isArray(payload)) return [];
  const names: string[] = [];
  for (const item of payload) {
    if (!isRecord(item)) continue;
    const name = item[key];
    if (typeof name === "string" && name.trim().length > 0) {
      names.push(name.trim());
    }
  }
  return names;
}

/** `JSON.parse` tolerante ao BOM UTF-8 que vem no arquivo do GitHub raw. */
function parseJsonWithBom(text: string): unknown {
  return JSON.parse(text.replace(/^﻿/, ""));
}

async function fetchNames(source: Source): Promise<string[]> {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const names = source.extract(parseJsonWithBom(await response.text()));
  if (names.length === 0) {
    throw new Error("resposta sem municípios reconhecíveis");
  }
  return names;
}

function serialize(cities: readonly string[], sourceLabel: string): string {
  const generatedAt = new Date().toISOString();
  const body = cities.map((city) => `  ${JSON.stringify(city)},`).join("\n");

  return `/**
 * ARQUIVO GERADO — NÃO EDITE À MÃO.
 *
 * Regenerado por \`pnpm gen:cities\` (scripts/generate-mg-cities.mts).
 *
 * Fonte:  ${sourceLabel}
 * Gerado: ${generatedAt}
 * Total:  ${cities.length} municípios
 */

export const MG_CITIES: readonly string[] = [
${body}
];
`;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  let names: string[] | null = null;
  let usedSource: Source | null = null;

  for (const source of SOURCES) {
    process.stdout.write(`→ tentando ${source.label}… `);
    try {
      names = await fetchNames(source);
      usedSource = source;
      console.log(`ok (${names.length} municípios)`);
      break;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`falhou (${reason})`);
      failures.push(`${source.label}: ${reason}`);
    }
  }

  if (!names || !usedSource) {
    console.error("\n✖ Nenhuma fonte respondeu. Tentativas:");
    for (const failure of failures) console.error(`  · ${failure}`);
    process.exitCode = 1;
    return;
  }

  if (usedSource.uppercase) {
    console.warn(
      "\n⚠ Fonte de último recurso: os nomes vêm em CAIXA ALTA " +
        "(ex.: “BELO HORIZONTE”). Rode de novo quando o IBGE voltar para ter a " +
        "capitalização correta.",
    );
  }

  // Dedup + ordenação alfabética pt-BR (respeita acentos: “Açucena” < “Alfenas”).
  const cities = Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  if (cities.length !== EXPECTED_COUNT) {
    console.warn(
      `\n⚠ Esperava ${EXPECTED_COUNT} municípios em MG, recebi ${cities.length}. ` +
        "Verifique a fonte antes de confiar no arquivo gerado.",
    );
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, serialize(cities, usedSource.label), "utf8");

  console.log(`\n✔ ${OUTPUT_PATH}`);
  console.log(`  ${cities.length} municípios · fonte: ${usedSource.label}`);
  console.log(`  primeiro: ${cities[0]} · último: ${cities[cities.length - 1]}`);
}

await main();
