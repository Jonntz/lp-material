/**
 * Máscara e validação de celular brasileiro.
 *
 * `formatPhone` é pura e determinística de propósito: o input do formulário é
 * controlado, e todo o cuidado com posição de cursor fica no componente.
 */

/** Comprimento da string formatada completa: `(31) 98362-6852`. */
export const PHONE_MAX_LENGTH = 15;

/** Quantidade de dígitos de um celular com DDD, sem DDI. */
const MOBILE_DIGITS = 11;

/**
 * DDDs em uso no Brasil (Plano Nacional de Numeração da Anatel).
 * As lacunas são reais — não existem, por exemplo, os DDDs 20, 23, 25, 26, 29,
 * 30, 36, 39, 40, 50, 52, 56-60, 70, 72, 76, 78, 80 e 90.
 */
export const VALID_DDDS: Set<string> = new Set([
  // Sudeste
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  // Sul
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  // Centro-Oeste e Norte
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  // Nordeste
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  // Norte
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

/** Só os dígitos do valor. */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Remove o DDI 55 de valores colados (`+55 31 98362-6852`, `5531983626852`).
 * Só age quando o tamanho bate com DDI + DDD + 8 ou 9 dígitos, para não comer o
 * DDD 55 (Santa Maria/RS) de um número já sem DDI.
 */
function stripCountryCode(digits: string): string {
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Dígitos do celular já sem o DDI — é essa a forma que vai para a planilha.
 * `"+55 (31) 98362-6852"` → `"31983626852"`
 */
export function toMobileDigits(value: string): string {
  return stripCountryCode(unformatPhone(value)).slice(0, MOBILE_DIGITS);
}

/**
 * Máscara progressiva, aplicada a cada tecla.
 *
 * `""` → `""` · `"3"` → `"(3"` · `"31"` → `"(31)"` · `"319"` → `"(31) 9"` ·
 * `"31983626852"` → `"(31) 98362-6852"`
 */
export function formatPhone(value: string): string {
  const digits = toMobileDigits(value);

  if (digits.length === 0) return "";
  if (digits.length === 1) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length === 0) return `(${ddd})`;
  if (rest.length <= 5) return `(${ddd}) ${rest}`;

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/**
 * Celular válido: 11 dígitos, DDD real, nono dígito `9` e não uma sequência de
 * dígitos repetidos (`(11) 11111-1111` é digitação de teste, não telefone).
 */
export function isValidMobile(value: string): boolean {
  const digits = stripCountryCode(unformatPhone(value));

  if (digits.length !== MOBILE_DIGITS) return false;
  if (!VALID_DDDS.has(digits.slice(0, 2))) return false;
  // O nono dígito é o primeiro do número, logo após o DDD.
  if (digits[2] !== "9") return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  return true;
}
