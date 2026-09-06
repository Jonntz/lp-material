import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token assinado que carrega o instante em que o formulário foi renderizado.
 *
 * O servidor emite `${timestamp}.${hmac}` num campo escondido; na hora do envio
 * conferimos a assinatura e a idade. Isso responde duas perguntas de uma vez:
 *
 * - **rápido demais?** ninguém lê quatro campos e envia em menos de 3 segundos;
 * - **velho demais?** um token de ontem indica página reaproveitada por script.
 *
 * Como a assinatura é HMAC-SHA256 com segredo do servidor, o bot não consegue
 * forjar um timestamp conveniente — teria que esperar de verdade.
 *
 * Não é autenticação nem CSRF token: é uma barreira barata contra automação
 * burra, somada ao honeypot e ao rate limit.
 */

/** Tempo mínimo entre renderizar e enviar. Abaixo disso, é robô. */
const DEFAULT_MIN_AGE_MS = 3_000;

/** Validade do token: 6 horas. Depois disso a página precisa ser recarregada. */
const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** SHA-256 em hexadecimal tem sempre 64 caracteres. */
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Segredo de emergência, sorteado uma vez por processo.
 *
 * Só entra em cena quando `FORM_HMAC_SECRET` não está configurado. Preferimos
 * isto a lançar erro porque `issueFormToken()` roda no render da página: sem
 * segredo, um `throw` derrubaria a landing page inteira (e o `next build`) por
 * causa de uma variável de ambiente esquecida.
 *
 * Sendo aleatório, ninguém consegue forjar token — o preço é que os tokens não
 * atravessam reinícios nem múltiplas instâncias, e aí o usuário legítimo vê
 * “recarregue a página”. Por isso o aviso abaixo é `console.error`: em produção
 * isto é bug de configuração, não modo de operação.
 */
const FALLBACK_SECRET = randomBytes(32).toString("hex");

let warnedAboutFallback = false;

/**
 * Segredo do HMAC, lido a cada chamada (barato) para respeitar mudanças de
 * `process.env` — inclusive as que os testes fazem.
 *
 * Não passa por `getServerEnv()` de propósito: o token do formulário precisa
 * funcionar mesmo sem as credenciais do Google Sheets configuradas.
 */
function getFormSecret(): string {
  const secret = process.env.FORM_HMAC_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.error(
      "[form-token] FORM_HMAC_SECRET ausente ou com menos de 32 caracteres. " +
        "Usando um segredo aleatório temporário: os tokens deixam de valer a cada " +
        "reinício e não valem entre instâncias. Configure a variável (veja .env.example).",
    );
  }

  return FALLBACK_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getFormSecret()).update(payload).digest("hex");
}

/** Emite um token com o instante atual. Chame no render do formulário. */
export function issueFormToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export type FormTokenFailureReason =
  /** Não tem o formato `timestamp.assinatura`. */
  | "malformed"
  /** Assinatura não confere — timestamp adulterado ou segredo diferente. */
  | "bad-signature"
  /** Enviado antes do tempo mínimo: comportamento de robô. */
  | "too-fast"
  /** Token velho demais: a página ficou aberta tempo demais. */
  | "expired";

export type FormTokenVerification =
  | { valid: true }
  | { valid: false; reason: FormTokenFailureReason };

export type VerifyFormTokenOptions = {
  /** Idade mínima aceita, em ms. Padrão: 3000. */
  minAgeMs?: number;
  /** Idade máxima aceita, em ms. Padrão: 6 horas. */
  maxAgeMs?: number;
};

/**
 * Confere assinatura e idade do token.
 *
 * A assinatura é checada **antes** da idade: assim, mexer no timestamp devolve
 * `bad-signature` (e não `expired`), que é a informação honesta.
 */
export function verifyFormToken(
  token: string,
  opts?: VerifyFormTokenOptions,
): FormTokenVerification {
  const minAgeMs = opts?.minAgeMs ?? DEFAULT_MIN_AGE_MS;
  const maxAgeMs = opts?.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

  if (typeof token !== "string" || token.length === 0) {
    return { valid: false, reason: "malformed" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };

  const [issuedAtRaw, signature] = parts;
  // Até 15 dígitos cobre timestamps em ms por alguns milênios e evita
  // `Number` estourando a precisão segura.
  if (!/^\d{1,15}$/.test(issuedAtRaw) || !SIGNATURE_PATTERN.test(signature)) {
    return { valid: false, reason: "malformed" };
  }

  const expected = Buffer.from(sign(issuedAtRaw), "hex");
  const received = Buffer.from(signature, "hex");

  // `timingSafeEqual` exige buffers do mesmo tamanho; o regex acima já garante,
  // mas a checagem fica como rede de segurança.
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return { valid: false, reason: "bad-signature" };
  }

  const ageMs = Date.now() - Number(issuedAtRaw);

  // Idade negativa (relógio adiantado no cliente? token do futuro?) cai aqui
  // também — tratar como "rápido demais" é o lado seguro.
  if (ageMs < minAgeMs) return { valid: false, reason: "too-fast" };
  if (ageMs > maxAgeMs) return { valid: false, reason: "expired" };

  return { valid: true };
}
