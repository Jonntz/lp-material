import { z } from "zod";

import {
  MESSAGES,
  NORMALIZE,
  validateCelular,
  validateCidade,
  validateConsentimento,
  validateNome,
} from "@/lib/validation";

/**
 * Schema zod do lead — **usado só no servidor**.
 *
 * As regras não moram aqui: este módulo é uma casca fina sobre os validadores
 * puros de `src/lib/validation.ts`. A separação existe porque `validation.ts` é
 * importado pelo formulário (componente cliente) e o zod arrasta todos os seus
 * locales para o bundle. Aqui o zod entrega o que ele faz de melhor e que os
 * predicados não fazem: parsear, normalizar a saída e falhar de forma tipada
 * antes de a linha ir para a planilha.
 *
 * Cada campo produz **no máximo um `issue`** (o validador devolve a primeira
 * mensagem e para), o que mantém a validação sequencial coerente entre os dois
 * lados.
 */
function fieldSchema(
  validate: (value: string) => string | null,
  normalize: (value: string) => string,
  requiredMessage: string,
) {
  return z
    .string(requiredMessage)
    .superRefine((value, ctx) => {
      const message = validate(value);
      if (message) ctx.addIssue({ code: "custom", message });
    })
    .transform(normalize);
}

export const leadSchema = z.object({
  nome: fieldSchema(validateNome, NORMALIZE.nome, MESSAGES.nome.required),
  cidade: fieldSchema(
    validateCidade,
    NORMALIZE.cidade,
    MESSAGES.cidade.required,
  ),
  celular: fieldSchema(
    validateCelular,
    NORMALIZE.celular,
    MESSAGES.celular.required,
  ),
  consentimento: z
    .boolean(MESSAGES.consentimento.required)
    .superRefine((value, ctx) => {
      const message = validateConsentimento(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
});

/** Valores já normalizados, prontos para gravação. */
export type ParsedLead = z.output<typeof leadSchema>;
