/**
 * Constantes editoriais e legais da campanha.
 * Textos e números vêm da página de referência e da identidade visual.
 */

/**
 * Endereço público do site, usado em canonical, Open Graph, sitemap e JSON-LD.
 *
 * Precedência:
 * 1. `NEXT_PUBLIC_SITE_URL` — definido à mão. É o que vale quando houver domínio
 *    próprio, e sobrepõe tudo.
 * 2. `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` — a Vercel injeta sozinha o
 *    domínio **de produção** do projeto (sem protocolo). Isso evita o pior caso:
 *    esquecer a variável e publicar o site inteiro com canonical apontando para
 *    `localhost`, o que tira a página do índice do Google. Note que é a URL de
 *    produção mesmo em preview — de propósito: preview não deve declarar
 *    canonical próprio.
 * 3. localhost, para desenvolvimento.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE = {
  name: "Matheus Biancardine 3055",
  candidate: "Matheus Biancardine",
  candidateLegalName: "Matheus Biancardine Mota",
  role: "Deputado Federal",
  number: "3055",
  party: "Partido Novo",
  partyAbbr: "NOVO",
  state: "MG",
  stateName: "Minas Gerais",
  cnpj: "68.306.593/0001-52",
  cityCount: 853,
  title: "Matheus Biancardine 3055 | Material de Campanha Gratuito",
  description:
    "Receba gratuitamente o kit de campanha de Matheus Biancardine, Deputado Federal por Minas Gerais pelo Partido Novo. Artes, textos e roteiros prontos para mobilizar sua cidade.",
  ogDescription:
    "Kit de campanha gratuito para apoiadores nas 853 cidades de Minas Gerais. Baixe artes, textos e roteiros prontos.",
  themeColor: "#012E40",
  url: resolveSiteUrl(),
} as const;

/** Destinos oferecidos no modal exibido após o cadastro. */
export const POST_SIGNUP_LINKS = {
  linktree: {
    label: "Acessar o material",
    description: "Todos os links da campanha em um só lugar.",
    href: "https://linktr.ee/matheus.biancardine?utm_source=linktree_profile_share&ltsid=98424602-7318-4a52-b31e-e23c9333d886",
  },
  vakinha: {
    label: "Apoiar a campanha",
    description: "Contribua com qualquer valor para a vakinha.",
    href: "https://queroapoiar.com.br/matheusbiancardine",
  },
} as const;

/** Âncoras de navegação usadas no menu lateral. */
export const NAV_LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#material", label: "O que você recebe" },
  { href: "#candidato", label: "Quem é o Matheus" },
  { href: "#cadastro", label: "Quero meu material" },
] as const;

export const LEGAL = {
  electoralNotice: `Propaganda Eleitoral | ${SITE.candidateLegalName} | CNPJ: ${SITE.cnpj} | ${SITE.party} (${SITE.partyAbbr}) - ${SITE.state}`,
  lgpdNotice: `Ao fornecer seus dados para baixar os materiais de apoio de ${SITE.candidateLegalName}, você manifesta seu consentimento livre e expresso para receber comunicações de campanha, propostas políticas e atualizações eleitorais via e-mail e WhatsApp, em conformidade com a LGPD. Seus dados de cadastro serão utilizados exclusivamente para fins eleitorais desta campanha e não serão compartilhados com terceiros. Você poderá revogar este consentimento a qualquer momento.`,
  /**
   * Canal para o titular exercer os direitos da LGPD (art. 18).
   * TODO(contato): trocar pelo e-mail real da campanha — este é um placeholder.
   */
  privacyContact: "contato@matheusbiancardine.com.br",
} as const;
