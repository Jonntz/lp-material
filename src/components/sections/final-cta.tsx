import type { ReactNode } from "react";

/**
 * Cabeçalho da seção final. O formulário de cadastro entra via `children`
 * (a âncora `#cadastro` fica no próprio formulário).
 */
export function FinalCta({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-14 sm:py-20">
      <h2 className="text-center font-display text-2xl leading-tight font-black sm:text-4xl">
        Você pode assistir a eleição. Ou pode decidi-la.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground sm:text-lg">
        Cada apoiador com material na mão vale mais que dez outdoors. Baixe o
        kit, mande no grupo, publique no seu perfil. É assim que campanha
        honesta cresce em Minas.
      </p>
      <div className="mt-8">{children}</div>
    </section>
  );
}
