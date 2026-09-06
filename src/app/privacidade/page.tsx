import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { LEGAL, SITE } from "@/config/site";

/**
 * Data da última revisão do texto. É manual de propósito: política de
 * privacidade que "muda sozinha" a cada deploy não vale nada como registro.
 */
const LAST_UPDATED = "5 de setembro de 2026";

export const metadata: Metadata = {
  title: `Política de Privacidade | ${SITE.name}`,
  description: `Como a campanha de ${SITE.candidateLegalName} coleta, usa e protege os dados de quem se cadastra para receber o material de campanha, de acordo com a LGPD (Lei 13.709/2018).`,
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-muted-foreground leading-relaxed marker:text-primary-text">
      {children}
    </ul>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
      {/* TODO(jurídico): revisar com o jurídico da campanha antes de publicar */}
      {/* Este texto é uma base técnica escrita a partir do que o site de fato
          faz — não é parecer jurídico. */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-text underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para a página inicial
      </Link>

      <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Política de Privacidade
      </h1>

      <p className="mt-4 text-muted-foreground leading-relaxed">
        Esta página explica, em português claro, o que fazemos com os dados que
        você preenche no formulário desta campanha. Última atualização:{" "}
        <strong className="font-semibold text-foreground">{LAST_UPDATED}</strong>
        .
      </p>

      <Section title="Quem trata seus dados">
        <p className="text-muted-foreground leading-relaxed">
          O controlador dos dados é a campanha de{" "}
          <strong className="font-semibold text-foreground">
            {SITE.candidateLegalName}
          </strong>
          , candidato a {SITE.role} por {SITE.stateName} pelo {SITE.party} (
          {SITE.partyAbbr}), inscrita no CNPJ{" "}
          <span className="whitespace-nowrap">{SITE.cnpj}</span>. É essa campanha
          que decide como e por que seus dados são usados.
        </p>
      </Section>

      <Section title="Quais dados coletamos">
        <p className="text-muted-foreground leading-relaxed">
          Somente o necessário para entregar o material de campanha:
        </p>
        <List>
          <li>seu nome completo;</li>
          <li>a cidade de {SITE.stateName} onde você mora;</li>
          <li>seu número de celular com DDD;</li>
          <li>a data e a hora em que você fez o cadastro.</li>
        </List>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Não pedimos CPF, e-mail, título de eleitor nem qualquer dado sensível
          (origem racial, opinião política, religião, saúde, biometria). Também
          não compramos listas nem importamos contatos de outras bases.
        </p>
      </Section>

      <Section title="Para que usamos">
        <p className="text-muted-foreground leading-relaxed">
          Usamos seus dados para enviar, por WhatsApp, o material de campanha e
          as comunicações eleitorais desta candidatura: artes, textos, roteiros,
          propostas e atualizações. A finalidade é exclusivamente eleitoral e
          restrita a esta campanha. Não usamos os dados para publicidade
          comercial, perfilamento ou qualquer decisão automatizada.
        </p>
      </Section>

      <Section title="Base legal">
        <p className="text-muted-foreground leading-relaxed">
          O tratamento se apoia no seu{" "}
          <strong className="font-semibold text-foreground">
            consentimento livre e informado
          </strong>
          , previsto no art. 7º, inciso I, da Lei 13.709/2018 (LGPD). Esse
          consentimento é o que você dá ao marcar a caixa de autorização no
          formulário — sem ela, o cadastro não é enviado. Você pode retirá-lo
          quando quiser, como explicamos abaixo.
        </p>
      </Section>

      <Section title="Com quem compartilhamos">
        <p className="text-muted-foreground leading-relaxed">
          Não vendemos, alugamos nem cedemos seus dados de cadastro a terceiros,
          e não os compartilhamos com outras campanhas ou com o partido para usos
          próprios. Os dados de navegação seguem regra própria, descrita em
          “Cookies e medição de audiência”.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Os cadastros ficam guardados em uma planilha do Google Workspace, que
          atua como{" "}
          <strong className="font-semibold text-foreground">operador</strong> —
          ou seja, um fornecedor que armazena os dados seguindo as instruções da
          campanha e não pode usá-los para fins próprios. Esse armazenamento pode
          ocorrer em servidores fora do Brasil, conforme a infraestrutura do
          provedor.
        </p>
      </Section>

      <Section title="Por quanto tempo guardamos">
        <p className="text-muted-foreground leading-relaxed">
          Mantemos seus dados até o fim do período eleitoral ou até você revogar
          o consentimento — o que acontecer primeiro. Depois disso, os registros
          são eliminados, salvo quando a legislação eleitoral exigir a guarda por
          prazo determinado.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p className="text-muted-foreground leading-relaxed">
          O art. 18 da LGPD garante a você, a qualquer momento e sem custo:
        </p>
        <List>
          <li>confirmação de que tratamos seus dados;</li>
          <li>acesso aos dados que temos sobre você;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados fora da lei;
          </li>
          <li>portabilidade dos dados a outro fornecedor;</li>
          <li>eliminação dos dados tratados com base no consentimento;</li>
          <li>
            informação sobre com quem compartilhamos seus dados e sobre a
            possibilidade de não consentir;
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              revogação do consentimento a qualquer momento
            </strong>
            , o que interrompe o envio das comunicações.
          </li>
        </List>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Para exercer qualquer um deles, escreva para{" "}
          <a
            href={`mailto:${LEGAL.privacyContact}`}
            className="font-medium text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {LEGAL.privacyContact}
          </a>
          . Respondemos no prazo da lei. Você também pode sair da lista a
          qualquer momento respondendo à mensagem que receber no WhatsApp.
        </p>
      </Section>

      <Section title="Cookies e medição de audiência">
        <p className="text-muted-foreground leading-relaxed">
          Este site usa duas ferramentas de medição, carregadas em todas as
          páginas:
        </p>
        <List>
          <li>
            <strong className="font-semibold text-foreground">
              Google Tag Manager
            </strong>{" "}
            (Google), que mede audiência — quantas pessoas visitam, de onde vêm e
            quais trechos da página funcionam;
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Meta Pixel
            </strong>{" "}
            (Meta/Facebook), que mede o resultado dos anúncios da campanha no
            Facebook e no Instagram e permite exibir anúncios a quem já visitou
            este site.
          </li>
        </List>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          As duas gravam cookies no seu navegador e recebem dados sobre a sua
          visita — páginas vistas, horário, endereço de IP, navegador e
          dispositivo. Esses dados vão para Google e Meta, que os tratam como
          controladores independentes, segundo as próprias políticas de
          privacidade, e podem cruzá-los com sua conta nesses serviços. O
          tratamento se apoia no{" "}
          <strong className="font-semibold text-foreground">
            legítimo interesse
          </strong>{" "}
          da campanha em medir o alcance da divulgação (art. 7º, IX, da LGPD), e
          você pode se opor a ele.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Para recusar, basta bloquear cookies de terceiros nas configurações do
          seu navegador, ou usar a navegação anônima — o site funciona
          normalmente sem eles, inclusive o formulário. Você também pode ajustar
          o rastreamento de anúncios direto nas{" "}
          <a
            href="https://www.facebook.com/settings?tab=ads"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            preferências de anúncios da Meta
          </a>{" "}
          e no{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            complemento de desativação do Google Analytics
          </a>
          .
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          O que você digita no formulário{" "}
          <strong className="font-semibold text-foreground">
            não é enviado para essas ferramentas
          </strong>
          . Nome, cidade e celular saem apenas para a planilha da campanha.
        </p>
      </Section>

      <Section title="Segurança">
        <p className="text-muted-foreground leading-relaxed">
          Todo o tráfego entre o seu navegador e o site é criptografado por
          HTTPS. O acesso à planilha de cadastros é restrito à equipe da campanha
          que precisa dela para enviar o material. Nenhum sistema é infalível,
          mas coletamos o mínimo justamente para que um eventual incidente
          exponha o mínimo.
        </p>
      </Section>

      <Section title="Alterações nesta política">
        <p className="text-muted-foreground leading-relaxed">
          Se este texto mudar, a nova versão passa a valer a partir da publicação
          nesta mesma página, com a data de atualização revista no topo. Mudanças
          que ampliem o uso dos seus dados serão comunicadas e dependerão de novo
          consentimento.
        </p>
      </Section>

      <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground leading-relaxed">
        {LEGAL.electoralNotice}
      </p>
    </main>
  );
}
