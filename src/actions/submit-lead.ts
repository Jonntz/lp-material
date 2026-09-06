"use server";

import { headers } from "next/headers";

import { MG_CITIES } from "@/data/mg-cities";
import { isSheetsConfigured } from "@/lib/env";
import { verifyFormToken } from "@/lib/form-token";
import { foldAccents } from "@/lib/normalize";
import { formatPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { appendLeadRow } from "@/lib/sheets";
import { leadSchema } from "@/lib/lead-schema";
import { firstError, type FieldName } from "@/lib/validation";

/**
 * Server Action do formulário de cadastro, consumida com `useActionState`.
 *
 * Ordem das checagens (da mais barata para a mais cara): honeypot → token
 * assinado → rate limit → validação → gravação. Nenhuma delas loga nome,
 * cidade ou telefone.
 */

export type SubmitState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; field?: FieldName };

/** Nome do campo isca. Fica escondido no formulário; humano nunca preenche. */
const HONEYPOT_FIELD = "empresa";

/** Teto do campo de origem (UTM/referrer) antes de ir para a planilha. */
const MAX_ORIGEM_LENGTH = 200;

const MESSAGES = {
  tooFast: "Envio muito rápido. Tente novamente.",
  staleToken:
    "Esta página ficou aberta tempo demais. Recarregue e envie de novo.",
  rateLimited: "Muitas tentativas. Tente de novo em alguns minutos.",
  invalid: "Confira os dados e tente novamente.",
  writeFailed:
    "Não conseguimos salvar seu cadastro agora. Tente novamente em instantes.",
} as const;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Checkbox marcado chega como `"on"`; outros clientes mandam `"true"`/`"1"`. */
function readCheckbox(formData: FormData, name: string): boolean {
  const value = readText(formData, name).trim().toLowerCase();
  return value === "on" || value === "true" || value === "1" || value === "sim";
}

/**
 * Identificador para o rate limit.
 *
 * Atrás de proxy/CDN o IP real é o primeiro item de `x-forwarded-for`. Sem
 * cabeçalho nenhum (dev local, alguns runtimes) todo mundo cai em `"unknown"` e
 * divide o mesmo balde — aceitável, já que aí não há proxy e o tráfego é local.
 */
async function getClientKey(): Promise<string> {
  const headerList = await headers();

  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Troca o que a pessoa digitou pelo nome oficial do município.
 *
 * `firstError` já garantiu que a cidade existe em MG, mas comparando sem acento
 * e sem caixa — então "belo horizonte" passa. Na planilha queremos sempre
 * "Belo Horizonte", para os filtros e as contagens por cidade baterem.
 */
function canonicalCity(value: string): string {
  const needle = foldAccents(value);
  return MG_CITIES.find((city) => foldAccents(city) === needle) ?? value;
}

/** Origem do lead: o que o formulário mandou (UTM) ou, na falta, o referrer. */
async function getOrigem(formData: FormData): Promise<string> {
  const fromForm = readText(formData, "origem").trim();
  if (fromForm) return fromForm.slice(0, MAX_ORIGEM_LENGTH);

  const headerList = await headers();
  return (headerList.get("referer") ?? "").slice(0, MAX_ORIGEM_LENGTH);
}

export async function submitLead(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // 1. Honeypot. Campo escondido preenchido = script. Devolvemos sucesso para
  //    o bot achar que funcionou e não ficar tentando de outro jeito.
  if (readText(formData, HONEYPOT_FIELD).trim() !== "") {
    console.warn("[lead] honeypot acionado");
    return { status: "success" };
  }

  // 2. Token assinado: o formulário foi renderizado quando?
  const token = verifyFormToken(readText(formData, "formToken"));
  if (!token.valid) {
    console.warn(`[lead] token recusado: ${token.reason}`);
    return {
      status: "error",
      message:
        token.reason === "too-fast" ? MESSAGES.tooFast : MESSAGES.staleToken,
    };
  }

  // 3. Rate limit por IP (por instância — ver o cabeçalho de rate-limit.ts).
  const clientKey = await getClientKey();
  if (!rateLimit(`lead:${clientKey}`).allowed) {
    console.warn("[lead] rate limit atingido");
    return { status: "error", message: MESSAGES.rateLimited };
  }

  // 4. Validação — a mesma do cliente, porque o cliente pode ser contornado.
  const values = {
    nome: readText(formData, "nome"),
    cidade: readText(formData, "cidade"),
    celular: readText(formData, "celular"),
    consentimento: readCheckbox(formData, "consentimento"),
  };

  const invalid = firstError(values, { cities: MG_CITIES });
  if (invalid) {
    // `field` volta para o cliente destacar o campo certo e mover o foco.
    return { status: "error", message: invalid.message, field: invalid.field };
  }

  // O schema devolve os valores normalizados (nome capitalizado, celular só
  // com os dígitos) — é isso que vai para a planilha, não o texto cru.
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) {
    console.error("[lead] schema recusou valores aprovados por firstError");
    return { status: "error", message: MESSAGES.invalid };
  }
  const lead = parsed.data;

  // 5. Gravação.
  if (!isSheetsConfigured()) {
    // Em DESENVOLVIMENTO seguimos com sucesso mesmo sem credenciais, para o
    // site poder ser trabalhado e demonstrado antes de a planilha existir.
    //
    // Em PRODUÇÃO isso seria perder cadastro em silêncio — o pior desfecho
    // possível para uma landing de captação. Lá a gente falha alto, para o
    // apoiador tentar de novo depois e o erro aparecer no monitoramento.
    console.error(
      "[lead] Google Sheets NÃO configurado — lead não gravado. " +
        "Preencha as variáveis do .env.example (passo a passo em CLAUDE.md).",
    );

    if (process.env.NODE_ENV === "production") {
      return {
        status: "error",
        message:
          "Não conseguimos salvar seu cadastro agora. Tente novamente em instantes.",
      };
    }

    return { status: "success" };
  }

  try {
    await appendLeadRow({
      nome: lead.nome,
      cidade: canonicalCity(lead.cidade),
      // O schema guarda só os 11 dígitos; na planilha vai formatado, para a
      // equipe ler e copiar sem precisar reformatar (e para o Sheets não tratar
      // o número como valor numérico).
      celular: formatPhone(lead.celular),
      consentimento: lead.consentimento,
      origem: await getOrigem(formData),
    });
  } catch (error) {
    // Só a mensagem do erro da API (status + corpo truncado). Nada do lead.
    console.error(
      "[lead] falha ao gravar na planilha:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return { status: "error", message: MESSAGES.writeFailed };
  }

  // Sem `revalidatePath`: a landing é estática e não mostra nada derivado dos
  // leads, então invalidar o cache só custaria um rebuild à toa.
  return { status: "success" };
}
