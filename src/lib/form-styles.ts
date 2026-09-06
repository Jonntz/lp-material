/**
 * Tratamento visual dos campos do formulário.
 *
 * Fica isolado aqui porque o mesmo estilo é usado pelo `SignupForm` e pelo
 * `CityCombobox` — se divergirem, os campos ficam visivelmente diferentes um do
 * outro dentro do mesmo card.
 */
export const FIELD_INPUT_CLASS =
  "w-full rounded-lg border border-control-border bg-ink px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30";

export const FIELD_LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold tracking-wide uppercase";
