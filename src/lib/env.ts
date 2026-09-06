import "server-only";

import { z } from "zod";

/**
 * Variáveis de ambiente do servidor.
 *
 * A validação é **preguiçosa** de propósito: se rodasse no import do módulo, o
 * `next build` quebraria em qualquer máquina sem `.env.local` (CI, clone novo,
 * primeiro deploy). Aqui ela só acontece na primeira chamada de
 * `getServerEnv()` — ou seja, quando alguém realmente vai falar com o Google.
 *
 * Nenhum valor de variável é logado ou embutido em mensagem de erro. As
 * mensagens dizem apenas *qual* variável está faltando ou inválida.
 */

/** Chaves lidas do `process.env`. Nada além disto é tocado. */
const ENV_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SHEET_ID",
  "GOOGLE_SHEET_TAB",
  "FORM_HMAC_SECRET",
] as const;

/** Formato de uma chave PEM, seja PKCS#8 ("PRIVATE KEY") ou PKCS#1 ("RSA PRIVATE KEY"). */
const PEM_HEADER = /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/;

/**
 * Uma chave RSA-2048 em PKCS#8 tem ~1600 caracteres de base64 no corpo. O
 * placeholder do `.env.example` (`MIIE...`) tem algumas dezenas e passa no teste
 * do cabeçalho PEM, então sem esta checagem o app se dá por configurado e só
 * descobre o problema no `DECODER routines::unsupported` do OpenSSL, na hora de
 * gravar. Melhor recusar antes.
 */
const PEM_MIN_BODY_LENGTH = 500;

function pemBodyLength(key: string): number {
  return key
    .replace(/-----(?:BEGIN|END)(?: [A-Z]+)* PRIVATE KEY-----/g, "")
    .replace(/\s/g, "").length;
}

/**
 * Deixa a `private_key` no formato que o `google-auth-library` espera.
 *
 * Três formas chegam aqui na prática:
 * 1. PEM com `\n` escapado (o normal quando se copia do JSON para o `.env`);
 * 2. PEM literal com quebras de linha de verdade (painéis de deploy);
 * 3. o PEM inteiro em base64 (quando o painel não aceita quebras de linha).
 */
function normalizePrivateKey(value: string): string {
  // Aspas sobrando quando o valor é colado já entre aspas dentro do painel.
  const unquoted = value.trim().replace(/^["']|["']$/g, "");
  const unescaped = unquoted.replace(/\\n/g, "\n");

  if (PEM_HEADER.test(unescaped)) return unescaped;

  // Sem cabeçalho PEM: pode ser base64 do PEM inteiro.
  try {
    const decoded = Buffer.from(unescaped, "base64").toString("utf8");
    if (PEM_HEADER.test(decoded)) return decoded;
  } catch {
    // Não era base64 válido — cai no retorno abaixo e o refine reclama.
  }

  return unescaped;
}

const serverEnvSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.email(
    "precisa ser o `client_email` da service account (um e-mail)",
  ),
  GOOGLE_PRIVATE_KEY: z
    .string()
    .min(1, "não pode ficar vazia")
    .transform(normalizePrivateKey)
    .refine((key) => PEM_HEADER.test(key), {
      message:
        "não parece uma chave PEM — cole a `private_key` do JSON inteira (com os \\n) ou o PEM em base64",
    })
    .refine((key) => pemBodyLength(key) >= PEM_MIN_BODY_LENGTH, {
      message:
        "tem cabeçalho PEM mas corpo curto demais para ser uma chave real — parece o placeholder do .env.example; cole a `private_key` do JSON da service account",
    }),
  GOOGLE_SHEET_ID: z
    .string()
    .min(1, "não pode ficar vazio — é o trecho da URL entre /d/ e /edit"),
  GOOGLE_SHEET_TAB: z.string().min(1, "não pode ficar vazio").default("Leads"),
  FORM_HMAC_SECRET: z
    .string()
    .min(32, "precisa de pelo menos 32 caracteres (use `openssl rand -hex 32`)"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/** Lê as chaves conhecidas tratando string vazia como ausente. */
function readRawEnv(): Record<string, string | undefined> {
  const raw: Record<string, string | undefined> = {};

  for (const key of ENV_KEYS) {
    const value = process.env[key];
    raw[key] = value === undefined || value.trim() === "" ? undefined : value;
  }

  return raw;
}

/**
 * Valida (uma vez) e devolve as variáveis de ambiente do servidor.
 *
 * @throws {Error} listando exatamente quais variáveis faltam ou estão inválidas.
 *   A mensagem **nunca** contém o valor de nenhuma variável.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const raw = readRawEnv();
  const parsed = serverEnvSchema.safeParse(raw);

  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => {
      const name = String(issue.path[0] ?? "(desconhecida)");
      // Ausente e inválida rendem mensagens diferentes — quem está configurando
      // precisa saber se falta colar o valor ou se colou errado.
      const detail = raw[name] === undefined ? "está faltando" : issue.message;
      return `  - ${name}: ${detail}`;
    });

    throw new Error(
      [
        "Configuração do servidor incompleta. Problemas encontrados:",
        ...problems,
        "",
        "Preencha essas variáveis em `.env.local` seguindo o modelo em `.env.example`.",
        "O passo a passo da planilha está em CLAUDE.md › “Configuração da planilha do Google”.",
      ].join("\n"),
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * `true` quando dá para falar com a planilha.
 *
 * Serve para o site continuar de pé em desenvolvimento antes de as credenciais
 * chegarem: o formulário valida e responde normalmente, só não grava.
 */
export function isSheetsConfigured(): boolean {
  try {
    getServerEnv();
    return true;
  } catch {
    return false;
  }
}
