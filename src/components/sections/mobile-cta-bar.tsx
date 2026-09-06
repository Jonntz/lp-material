/** Barra fixa de CTA no mobile. Some a partir do breakpoint `sm`. */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
      <a
        href="#cadastro"
        className="cta-pulsante block rounded-xl bg-primary px-6 py-3.5 text-center font-display text-base font-black tracking-wide text-primary-foreground uppercase"
      >
        Quero meu material
      </a>
    </div>
  );
}
