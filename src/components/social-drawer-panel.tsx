"use client";

import Image from "next/image";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { activeSocialLinks } from "@/config/social";
import matheusLogo from "@/assets/logo/matheus-3055-cor.png";
import { NAV_LINKS, SITE } from "@/config/site";

type SocialDrawerPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Conteúdo do menu lateral.
 *
 * Separado do gatilho e carregado por `next/dynamic` no primeiro clique: o Sheet
 * do Radix é a parte pesada e ninguém precisa dele para ler a página. O Radix
 * devolve o foco para o elemento que estava focado na abertura — o hambúrguer —
 * mesmo sem `SheetTrigger`.
 */
export function SocialDrawerPanel({
  open,
  onOpenChange,
}: SocialDrawerPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(20rem,85vw)] border-l border-border bg-card sm:max-w-xs"
      >
        <SheetHeader className="px-6 pt-6 pb-2">
          {/* A logo oficial identifica o painel; "Menu" segue existindo para
              leitor de tela, via sr-only, porque o SheetTitle é obrigatório. */}
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Image
            src={matheusLogo}
            alt=""
            aria-hidden="true"
            className="h-auto w-40"
            sizes="10rem"
          />
        </SheetHeader>

        <nav aria-label="Navegação principal" className="px-6">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <SheetClose asChild>
                  <a
                    href={link.href}
                    className="block rounded-lg px-3 py-3 font-display text-lg font-black text-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </a>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>

        {activeSocialLinks.length > 0 ? (
          <div className="mt-auto border-t border-border px-6 py-6">
            <p className="text-[0.68rem] font-bold tracking-[0.28em] text-muted-foreground uppercase">
              Siga a campanha
            </p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {activeSocialLinks.map(({ id, label, icon: Icon, href }) => (
                <li key={id}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} de ${SITE.candidate}`}
                    className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-ink text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border-t border-border px-6 py-6">
          <SheetClose asChild>
            <a
              href="#cadastro"
              className="block rounded-xl bg-primary px-5 py-3.5 text-center font-display text-base font-black tracking-wide text-primary-foreground uppercase transition active:scale-[0.99]"
            >
              Quero meu material
            </a>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
