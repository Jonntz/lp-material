/**
 * Regras de validação do formulário de apoio — compartilhadas entre o cliente
 * (feedback imediato no submit) e o servidor (checagem final antes de gravar).
 *
 * ## Validação sequencial
 *
 * O requisito é mostrar **um erro por vez**: ao submeter, só aparece a mensagem
 * do primeiro campo inválido na ordem de `FIELD_ORDER`. Por isso cada campo tem
 * seu próprio schema e a checagem interna é sequencial (`superRefine` com
 * `return` cedo), garantindo no máximo um `issue` por campo.
 *
 * ## Como a cidade é validada nos dois lados
 *
 * `src/data/mg-cities.ts` tem ~16 KB e é carregado sob demanda no cliente (só no
 * primeiro foco do combobox), então **o schema não importa a lista**. O desenho
 * escolhido é o mais simples dos dois propostos:
 *
 *   - `leadSchema.cidade` valida apenas obrigatoriedade/formato;
 *   - o pertencimento a Minas Gerais mora em `isMgCity` /
 *     `validateCityAgainst(cities)`, que recebem a lista por parâmetro.
 *
 * O cliente passa a lista já carregada; o servidor importa `MG_CITIES`
 * diretamente e passa também. Nenhum dos lados fica com uma regra que o outro
 * não tem, e o schema continua puro (sem contexto, sem estado global, sem
 * import pesado no topo).
 *
 * ## Por que não tem zod aqui
 *
 * Este módulo é importado pelo formulário, que é um componente cliente. O zod
 * carrega todos os seus locales junto (~50 KB gzip no bundle), e nada disso é
 * necessário para rodar quatro predicados. As regras aqui são funções puras que
 * devolvem a mensagem de erro ou `null`.
 *
 * O schema zod — que o servidor usa para *parsear e normalizar* antes de gravar
 * — mora em `src/lib/lead-schema.ts` e é construído em cima destas mesmas
 * funções. Regra única, dois consumidores, zod só no servidor.
 */

import { collapseSpaces, foldAccents, titleCaseName } from "@/lib/normalize";
import { isValidMobile, toMobileDigits, unformatPhone } from "@/lib/phone";

export const FIELD_ORDER = [
  "nome",
  "cidade",
  "celular",
  "consentimento",
] as const;

export type FieldName = (typeof FIELD_ORDER)[number];

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

function countLetters(token: string): number {
  return (token.match(/\p{L}/gu) ?? []).length;
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

/** Valida o nome. Devolve a mensagem de erro ou `null` se estiver ok. */
export function validateNome(value: string): string | null {
  const trimmed = collapseSpaces(value ?? "");

  if (trimmed.length === 0) return MESSAGES.nome.required;
  if (!NAME_ALLOWED.test(trimmed)) return MESSAGES.nome.invalidChars;
  if (trimmed.length > NAME_MAX_LENGTH) return MESSAGES.nome.tooLong;
  if (!hasGivenAndFamilyName(trimmed)) return MESSAGES.nome.incomplete;

  return null;
}

/**
 * Valida só obrigatoriedade. O “é mesmo uma cidade de MG?” vive em
 * `validateCityAgainst`, porque a lista chega por parâmetro (ver nota no topo).
 */
export function validateCidade(value: string): string | null {
  return collapseSpaces(value ?? "").length === 0
    ? MESSAGES.cidade.required
    : null;
}

/** Valida o celular. */
export function validateCelular(value: string): string | null {
  if (unformatPhone(value ?? "").length === 0) return MESSAGES.celular.required;
  if (!isValidMobile(value ?? "")) return MESSAGES.celular.invalid;
  return null;
}

/** Valida o aceite da LGPD. */
export function validateConsentimento(value: boolean): string | null {
  return value === true ? null : MESSAGES.consentimento.required;
}

/**
 * Normalizações aplicadas na gravação — nunca enquanto o usuário digita.
 * Usadas pelo schema zod do servidor (`src/lib/lead-schema.ts`).
 */
export const NORMALIZE = {
  nome: titleCaseName,
  cidade: collapseSpaces,
  /** Guardamos só os 11 dígitos, sem DDI: a máscara é enfeite de UI. */
  celular: toMobileDigits,
} as const;

export type LeadInput = {
  nome: string;
  cidade: string;
  celular: string;
  consentimento: boolean;
};

export type Lead = LeadInput;

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
  values: Partial<LeadInput>,
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
  values: Partial<LeadInput>,
  options?: { cities?: readonly string[] },
): { field: FieldName; message: string } | null {
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values, options?.cities);
    if (message) return { field, message };
  }
  return null;
}
