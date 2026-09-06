/**
 * Regras de validação do formulário — **parte sem zod**.
 *
 * ## Por que este arquivo existe
 *
 * O formulário é a única ilha `"use client"` da página, e ele precisa validar no
 * submit. Se ele importasse `@/lib/validation` (que usa zod), o zod inteiro
 * entraria no bundle inicial: o entrypoint `zod` reexporta
 * `export * as locales` com **todos os idiomas**, e o Turbopack não consegue
 * podar isso — eram ~497 KB (≈116 KB comprimidos) baixados por todo visitante
 * só para checar quatro campos.
 *
 * Então a lógica de verdade mora aqui, em JavaScript puro, e é o que o cliente
 * importa. `@/lib/validation` continua sendo a porta de entrada do servidor:
 * reexporta tudo daqui e adiciona os schemas zod, que fazem a normalização
 * (nome capitalizado, celular só com dígitos) antes de gravar na planilha.
 *
 * Os dois lados chamam as **mesmas** funções — `validateNome`, `validateCelular`
 * e `validateConsentimento` são a única fonte das mensagens, usadas tanto por
 * `firstError` quanto pelos `superRefine` dos schemas.
 */

import { collapseSpaces, foldAccents } from "@/lib/normalize";
import { isValidMobile, unformatPhone } from "@/lib/phone";

export const FIELD_ORDER = [
  "nome",
  "cidade",
  "celular",
  "consentimento",
] as const;

export type FieldName = (typeof FIELD_ORDER)[number];

/** Valores crus do formulário, como chegam do DOM. */
export type LeadValues = {
  nome: string;
  cidade: string;
  celular: string;
  consentimento: boolean;
};

/** Mensagens exibidas ao usuário, num só lugar para facilitar revisão de texto. */
export const MESSAGES = {
  nome: {
    required: "Preencha seu nome completo.",
    incomplete: "Digite seu nome e sobrenome.",
    invalidChars: "Use apenas letras no nome.",
    tooLong: "Use no máximo 80 caracteres no nome.",
  },
  cidade: {
    required: "Informe sua cidade de Minas Gerais.",
    notInList: "Selecione uma cidade de Minas Gerais na lista.",
  },
  celular: {
    required: "Informe seu número de celular.",
    invalid: "Digite um celular válido com DDD, ex.: (31) 98362-6852.",
  },
  consentimento: {
    required: "É preciso aceitar o uso dos seus dados para receber o material.",
  },
} as const;

const NAME_MAX_LENGTH = 80;

/** Partículas ignoradas ao contar nome + sobrenome. */
const NAME_PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);

/** Letras Unicode, espaço, hífen e apóstrofos — nada de dígitos ou símbolos. */
const NAME_ALLOWED = /^[\p{L}\s'’-]+$/u;

/** Hoisted: `countLetters` roda uma vez por token de cada nome digitado. */
const LETTER = /\p{L}/gu;

function countLetters(token: string): number {
  return (token.match(LETTER) ?? []).length;
}

/**
 * Nome completo = pelo menos dois tokens “de verdade” (2+ letras cada), sem
 * contar partículas. `"Ana de Sá"` passa; `"Ana"` e `"Ana de"` não.
 */
function hasGivenAndFamilyName(value: string): boolean {
  const tokens = collapseSpaces(value)
    .split(" ")
    .filter((token) => !NAME_PARTICLES.has(foldAccents(token)))
    .filter((token) => countLetters(token) >= 2);

  return tokens.length >= 2;
}

/** Primeira mensagem de erro do nome, ou `null`. Ordem: vazio → caracteres → tamanho → sobrenome. */
export function validateNome(value: string): string | null {
  const trimmed = collapseSpaces(value);

  if (trimmed.length === 0) return MESSAGES.nome.required;
  if (!NAME_ALLOWED.test(trimmed)) return MESSAGES.nome.invalidChars;
  if (trimmed.length > NAME_MAX_LENGTH) return MESSAGES.nome.tooLong;
  if (!hasGivenAndFamilyName(trimmed)) return MESSAGES.nome.incomplete;

  return null;
}

/** Primeira mensagem de erro do celular, ou `null`. */
export function validateCelular(value: string): string | null {
  if (unformatPhone(value).length === 0) return MESSAGES.celular.required;
  if (!isValidMobile(value)) return MESSAGES.celular.invalid;

  return null;
}

/** Mensagem de erro do consentimento, ou `null`. Só `true` passa. */
export function validateConsentimento(value: unknown): string | null {
  return value === true ? null : MESSAGES.consentimento.required;
}

/** A cidade digitada é um município de MG? Comparação sem acento e sem caixa. */
export function isMgCity(value: string, cities: readonly string[]): boolean {
  const needle = foldAccents(value);
  if (needle.length === 0) return false;
  return cities.some((city) => foldAccents(city) === needle);
}

/**
 * Fábrica do validador de cidade usado nos dois lados: recebe a lista uma vez e
 * devolve `(value) => mensagem | null`.
 *
 * Passar `undefined` desliga só a checagem de pertencimento (o campo continua
 * obrigatório) — é o que o cliente faz enquanto a lista ainda não carregou.
 */
export function validateCityAgainst(
  cities: readonly string[] | undefined,
): (value: string) => string | null {
  return (value) => {
    const trimmed = collapseSpaces(value ?? "");
    if (trimmed.length === 0) return MESSAGES.cidade.required;
    if (!cities) return null;
    return isMgCity(trimmed, cities) ? null : MESSAGES.cidade.notInList;
  };
}

function validateField(
  field: FieldName,
  values: Partial<LeadValues>,
  cities: readonly string[] | undefined,
): string | null {
  switch (field) {
    case "nome":
      return validateNome(values.nome ?? "");
    case "cidade":
      return validateCityAgainst(cities)(values.cidade ?? "");
    case "celular":
      return validateCelular(values.celular ?? "");
    case "consentimento":
      return validateConsentimento(values.consentimento ?? false);
  }
}

/**
 * Retorna o PRIMEIRO campo inválido na ordem de `FIELD_ORDER`, ou `null`.
 *
 * É o que o formulário chama no submit: um erro por vez, do campo mais acima.
 * Sem `options.cities`, a checagem de pertencimento a MG é pulada — o servidor
 * sempre passa a lista.
 */
export function firstError(
  values: Partial<LeadValues>,
  options?: { cities?: readonly string[] },
): { field: FieldName; message: string } | null {
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values, options?.cities);
    if (message) return { field, message };
  }
  return null;
}
