import { NextResponse } from "next/server";

import { issueFormToken } from "@/lib/form-token";

/**
 * Emite o token assinado que marca o instante em que o formulário foi aberto.
 *
 * Existe como rota própria porque a landing é estática: um token gerado no
 * build já nasceria vencido no primeiro visitante. O formulário busca este
 * endpoint ao montar.
 *
 * Nunca deve ser cacheado — cada visitante precisa do seu próprio instante.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  try {
    return NextResponse.json(
      { token: issueFormToken() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    // Sem FORM_HMAC_SECRET configurado. Logamos o motivo sem vazar o segredo.
    console.error(
      "[form-token] não foi possível emitir o token:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return NextResponse.json(
      { error: "token indisponível" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
