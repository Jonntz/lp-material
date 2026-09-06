"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { submitLead, type SubmitState } from "@/actions/submit-lead";
import dynamic from "next/dynamic";

import { CityCombobox } from "@/components/city-combobox";
import { Field, FieldError } from "@/components/ui/field";
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from "@/lib/form-styles";
import { formatPhone, PHONE_MAX_LENGTH, unformatPhone } from "@/lib/phone";
import { firstError, type FieldName } from "@/lib/validation";

/**
 * O modal só existe depois de um cadastro bem-sucedido, então o Dialog do Radix
 * fica fora do bundle inicial.
 */
const SuccessDialog = dynamic(
  () => import("@/components/success-dialog").then((m) => m.SuccessDialog),
  { ssr: false },
);

/**
 * Checkbox nativo estilizado. O "check" é um SVG embutido em `background-image`
 * na cor `--primary-foreground` (#012E40), que é o navy da identidade.
 */
const CONSENT_CHECKBOX_CLASS = [
  "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-[4px]",
  "border border-control-border bg-ink transition-colors",
  "checked:border-primary checked:bg-primary",
  "checked:bg-[length:14px_14px] checked:bg-center checked:bg-no-repeat",
  "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23012E40' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "aria-invalid:border-destructive",
].join(" ");

const INITIAL_STATE: SubmitState = { status: "idle" };

/** De onde veio o apoiador — UTM da URL ou, na falta dela, o referrer. */
function readLeadOrigin(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = ["utm_source", "utm_medium", "utm_campaign"]
    .map((key) => params.get(key))
    .filter(Boolean)
    .join(" · ");

  return utm || document.referrer || "direto";
}

type SignupFormProps = {
  /** Prefixo dos `id` dos campos — o formulário aparece duas vezes na página. */
  idPrefix: string;
  /** Só a instância do hero recebe a âncora `#cadastro`. */
  anchorId?: string;
};

/**
 * Formulário de captação.
 *
 * A validação é **sequencial**: no envio, só o primeiro campo inválido (na ordem
 * nome → cidade → celular → consentimento) é apontado, e o foco vai para ele.
 * O mesmo `firstError` roda de novo no servidor — o cliente aqui é conveniência,
 * não barreira.
 */
export function SignupForm({ idPrefix, anchorId }: SignupFormProps) {
  const [state, dispatch, isPending] = useActionState(submitLead, INITIAL_STATE);

  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [celular, setCelular] = useState("");
  const [consentimento, setConsentimento] = useState(false);

  const [clientError, setClientError] = useState<{
    field: FieldName;
    message: string;
  } | null>(null);

  const [formToken, setFormToken] = useState("");
  const [dismissedResult, setDismissedResult] = useState<SubmitState | null>(
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const cidadeRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const uid = useId();
  const ids = {
    nome: `${idPrefix}-nome`,
    cidade: `${idPrefix}-cidade`,
    celular: `${idPrefix}-celular`,
    consentimento: `${idPrefix}-consentimento`,
    error: `${idPrefix}-erro${uid}`,
  };

  /**
   * Token assinado que marca quando o formulário foi renderizado — o servidor
   * usa para rejeitar envios rápidos demais para serem humanos.
   *
   * Vem de uma rota dinâmica em vez de prop do servidor porque a página é
   * estática: um token gerado no build já nasceria vencido.
   */
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/form-token", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { token?: string } | null) => {
        if (data?.token) setFormToken(data.token);
      })
      .catch(() => {
        // Falha de rede aqui não trava nada: o envio segue e o servidor
        // responde pedindo para recarregar a página.
      });

    return () => controller.abort();
  }, []);

  /**
   * O modal de sucesso é **derivado** do resultado da action em vez de vir de um
   * efeito: cada envio bem-sucedido produz um objeto de estado novo, então
   * fechar o modal só precisa registrar qual resultado já foi visto.
   */
  const successOpen =
    state.status === "success" && state !== dismissedResult;

  const focusField = useCallback((field: FieldName) => {
    const target = {
      nome: nomeRef,
      cidade: cidadeRef,
      celular: celularRef,
      consentimento: consentRef,
    }[field];

    target.current?.focus();
  }, []);

  /**
   * Máscara do celular preservando a posição do cursor: conta quantos dígitos
   * existem antes do cursor e reposiciona depois do mesmo número de dígitos no
   * texto já formatado. Sem isso, editar o meio do número joga o cursor pro fim.
   */
  const handleCelularChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const caret = input.selectionStart ?? input.value.length;
      const digitsBeforeCaret = unformatPhone(
        input.value.slice(0, caret),
      ).length;

      const formatted = formatPhone(input.value);
      setCelular(formatted);

      requestAnimationFrame(() => {
        let seen = 0;
        let position = formatted.length;

        for (let i = 0; i < formatted.length; i += 1) {
          if (seen === digitsBeforeCaret) {
            position = i;
            break;
          }
          if (/\d/.test(formatted[i])) seen += 1;
        }

        if (seen === digitsBeforeCaret && position === formatted.length) {
          position = formatted.length;
        }

        input.setSelectionRange(position, position);
      });
    },
    [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    // A lista de municípios é carregada sob demanda; o import é cacheado, então
    // se o combobox já a trouxe isto resolve na hora.
    const { MG_CITIES } = await import("@/data/mg-cities");

    const problem = firstError(
      { nome, cidade, celular, consentimento },
      { cities: MG_CITIES },
    );

    if (problem) {
      setClientError(problem);
      focusField(problem.field);
      return;
    }

    setClientError(null);

    const payload = new FormData(form);
    payload.set("origem", readLeadOrigin());
    startTransition(() => dispatch(payload));
  }

  const serverError = state.status === "error" ? state : null;
  const errorField = clientError?.field ?? serverError?.field;
  const errorMessage = clientError?.message ?? serverError?.message;

  /**
   * Atributos ARIA do campo com erro. Só ARIA — `invalid` não é atributo de DOM
   * e o React reclama se ele chegar num `<input>` nativo; o `CityCombobox`,
   * que é componente nosso, recebe `invalid` explicitamente.
   */
  function fieldProps(field: FieldName) {
    const invalid = errorField === field;
    return {
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? ids.error : undefined,
    };
  }

  return (
    <>
      <div
        id={anchorId}
        className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-brand)] sm:p-7"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-primary uppercase">
          Acesso gratuito
        </span>
        <h3 className="mt-3 font-display text-2xl leading-tight font-black sm:text-3xl">
          Preencha e receba seu material
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Leva 30 segundos. Depois disso você já sai com conteúdo pronto para
          mobilizar sua cidade.
        </p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          {/* Campo-isca: invisível para gente, atraente para bot. Fica fora da
              viewport em vez de display:none porque muitos bots ignoram campos
              ocultos por display. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden opacity-0"
          >
            <label htmlFor={`${idPrefix}-empresa`}>Empresa</label>
            <input
              id={`${idPrefix}-empresa`}
              name="empresa"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="formToken" value={formToken} />

          <Field data-invalid={errorField === "nome" || undefined}>
            <label htmlFor={ids.nome} className={FIELD_LABEL_CLASS}>
              Nome completo
            </label>
            <input
              ref={nomeRef}
              id={ids.nome}
              name="nome"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder="Seu nome completo"
              className={FIELD_INPUT_CLASS}
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              {...fieldProps("nome")}
            />
          </Field>

          <Field
            className="relative"
            data-invalid={errorField === "cidade" || undefined}
          >
            <label htmlFor={ids.cidade} className={FIELD_LABEL_CLASS}>
              Cidade (MG)
            </label>
            <CityCombobox
              ref={cidadeRef}
              id={ids.cidade}
              name="cidade"
              value={cidade}
              onValueChange={setCidade}
              placeholder="Digite o nome da sua cidade"
              invalid={errorField === "cidade"}
              describedBy={errorField === "cidade" ? ids.error : undefined}
            />
          </Field>

          <Field data-invalid={errorField === "celular" || undefined}>
            <label htmlFor={ids.celular} className={FIELD_LABEL_CLASS}>
              Número do celular
            </label>
            <input
              ref={celularRef}
              id={ids.celular}
              name="celular"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_MAX_LENGTH}
              placeholder="(31) 90000-0000"
              className={FIELD_INPUT_CLASS}
              value={celular}
              onChange={handleCelularChange}
              {...fieldProps("celular")}
            />
          </Field>

          <Field
            orientation="horizontal"
            data-invalid={errorField === "consentimento" || undefined}
            className="items-start gap-3"
          >
            {/*
              Checkbox nativo em vez do primitivo do Radix: o Radix renderiza um
              <button role="checkbox">, e clicar num <label for> não alterna um
              button — só o quadradinho de 20px respondia. Com input nativo, o
              rótulo inteiro (415×59) vira alvo, e o navegador não repassa o
              clique quando ele nasce no link interno.
            */}
            <input
              ref={consentRef}
              id={ids.consentimento}
              name="consentimento"
              type="checkbox"
              checked={consentimento}
              onChange={(event) => setConsentimento(event.target.checked)}
              className={CONSENT_CHECKBOX_CLASS}
              {...fieldProps("consentimento")}
            />
            <label
              htmlFor={ids.consentimento}
              className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
            >
              Autorizo o uso dos meus dados para receber o material e as
              comunicações da campanha por WhatsApp, conforme a{" "}
              <a
                href="/privacidade"
                className="rounded text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Política de Privacidade
              </a>
              . Posso revogar quando quiser.
            </label>
          </Field>

          <FieldError id={ids.error} aria-live="polite">
            {errorMessage}
          </FieldError>

          <button
            type="submit"
            disabled={isPending}
            className="cta-pulsante w-full rounded-xl bg-primary px-6 py-4 font-display text-lg font-black tracking-wide text-primary-foreground uppercase transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Enviando…" : "Quero meu material"}
          </button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Ao enviar, você concorda em receber comunicações da campanha por
            e-mail e WhatsApp, conforme o aviso de privacidade no rodapé.
          </p>
        </form>
      </div>

      {successOpen ? (
        <SuccessDialog
          open
          onOpenChange={(open) => {
            if (!open) setDismissedResult(state);
          }}
        />
      ) : null}
    </>
  );
}
