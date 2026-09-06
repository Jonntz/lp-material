import type { SVGProps } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TelegramIcon,
  ThreadsIcon,
  TiktokIcon,
  WhatsappIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/icons/social";

export type SocialLink = {
  id: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  href: string;
};

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  COLE AQUI OS LINKS DAS REDES SOCIAIS                                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Preencha o `href` de cada rede que a campanha usa.                       ║
 * ║                                                                           ║
 * ║  Entrada com `href` vazio NÃO aparece no site — nem no menu lateral, nem  ║
 * ║  no rail do desktop, nem no rodapé. Por isso as redes que ainda não       ║
 * ║  existem ficam aqui com `href: ""` em vez de comentadas: o resultado na   ║
 * ║  tela é o mesmo, mas o import continua em uso (comentar a entrada e       ║
 * ║  deixar o import quebra o build) e, no dia em que a conta for criada,     ║
 * ║  basta colar a URL.                                                       ║
 * ║                                                                           ║
 * ║  A ORDEM DA LISTA É A ORDEM QUE APARECE NO SITE.                          ║
 * ║                                                                           ║
 * ║  Formatos esperados:                                                      ║
 * ║    Instagram  https://instagram.com/usuario                               ║
 * ║    LinkedIn   https://linkedin.com/in/usuario                             ║
 * ║    X          https://x.com/usuario                                       ║
 * ║    Threads    https://threads.com/@usuario                                ║
 * ║    WhatsApp   https://wa.me/5531983626852  (DDI+DDD+número, só dígitos)   ║
 * ║    Facebook   https://facebook.com/pagina                                 ║
 * ║    YouTube    https://youtube.com/@canal                                  ║
 * ║    TikTok     https://tiktok.com/@usuario                                 ║
 * ║    Telegram   https://t.me/usuario                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  // ── redes já ativas ──────────────────────────────────────────────────────
  {
    id: "instagram",
    label: "Instagram",
    icon: InstagramIcon,
    href: "https://instagram.com/matheus.biancardinemg",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: LinkedInIcon,
    href: "https://www.linkedin.com/in/matheus-biancardine-mota-8330b020a/",
  },
  {
    id: "x",
    label: "X",
    icon: XIcon,
    href: "https://x.com/BiancardineMota",
  },
  {
    id: "threads",
    label: "Threads",
    icon: ThreadsIcon,
    href: "https://www.threads.com/@matheus.biancardine",
  },

  // ── ainda sem conta: invisíveis no site até alguém colar a URL ───────────
  { id: "whatsapp", label: "WhatsApp", icon: WhatsappIcon, href: "" },
  { id: "facebook", label: "Facebook", icon: FacebookIcon, href: "" },
  { id: "youtube", label: "YouTube", icon: YoutubeIcon, href: "" },
  { id: "tiktok", label: "TikTok", icon: TiktokIcon, href: "" },
  { id: "telegram", label: "Telegram", icon: TelegramIcon, href: "" },
];

/** Só as redes que já têm link preenchido. É isto que o site renderiza. */
export const activeSocialLinks = SOCIAL_LINKS.filter(
  (link) => link.href.trim().length > 0,
);
