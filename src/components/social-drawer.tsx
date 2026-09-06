"use client";

import { MenuIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

/**
 * O painel (e com ele o Sheet do Radix) só é baixado quando alguém abre o menu.
 * Antes disso o custo é este botão.
 */
const SocialDrawerPanel = dynamic(
  () => import("./social-drawer-panel").then((m) => m.SocialDrawerPanel),
  { ssr: false },
);

/**
 * Menu lateral: botão hambúrguer fixo que abre um painel com as âncoras da
 * página e as redes sociais da campanha.
 *
 * Os links das redes vêm de `src/config/social.ts`; entradas sem `href`
 * preenchido nem chegam lá (`activeSocialLinks` já filtra).
 */
export function SocialDrawer() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /**
   * Devolve o foco ao hambúrguer ao fechar.
   *
   * O Radix restaura o foco para o elemento que estava ativo na abertura — o
   * que não é necessariamente o botão, já que nem todo navegador foca um
   * `<button>` ao ser clicado com o mouse. Fazendo explicitamente, quem fecha
   * com Escape sempre volta para um ponto conhecido da página.
   */
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        // Pré-carrega o painel no hover/foco, para o clique já achar o chunk pronto.
        onPointerEnter={() => setLoaded(true)}
        onFocus={() => setLoaded(true)}
        className="fixed top-12 right-3 z-40 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </button>

      {loaded ? (
        <SocialDrawerPanel open={open} onOpenChange={handleOpenChange} />
      ) : null}
    </>
  );
}
