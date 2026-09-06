"use client";

import { ArrowUpRightIcon, HeartHandshakeIcon, PartyPopperIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POST_SIGNUP_LINKS } from "@/config/site";

type SuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Modal exibido depois que o cadastro é gravado com sucesso.
 * Leva o apoiador para o Linktree (onde está o material) e para a vakinha.
 */
export function SuccessDialog({ open, onOpenChange }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-card sm:max-w-md">
        <DialogHeader className="p-0 text-center">
          <span className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <PartyPopperIcon className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle className="font-display text-2xl leading-tight font-black text-foreground">
            Cadastro confirmado!
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu material está a um clique. Abra o link abaixo e comece a
            mobilizar a sua cidade hoje mesmo.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          <a
            href={POST_SIGNUP_LINKS.linktree.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-pulsante flex items-center justify-between gap-3 rounded-xl bg-primary px-5 py-4 text-left font-display font-black tracking-wide text-primary-foreground uppercase transition active:scale-[0.99]"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-base leading-none">
                {POST_SIGNUP_LINKS.linktree.label}
              </span>
              <span className="text-[0.7rem] font-semibold normal-case opacity-80">
                {POST_SIGNUP_LINKS.linktree.description}
              </span>
            </span>
            <ArrowUpRightIcon className="size-5 shrink-0" aria-hidden="true" />
          </a>

          <a
            href={POST_SIGNUP_LINKS.vakinha.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-ink px-5 py-4 text-left font-display font-black tracking-wide text-foreground uppercase transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99]"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-base leading-none">
                {POST_SIGNUP_LINKS.vakinha.label}
              </span>
              <span className="text-[0.7rem] font-semibold normal-case text-muted-foreground">
                {POST_SIGNUP_LINKS.vakinha.description}
              </span>
            </span>
            <HeartHandshakeIcon className="size-5 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Os links abrem em uma nova aba.
        </p>
      </DialogContent>
    </Dialog>
  );
}
