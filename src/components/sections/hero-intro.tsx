import { SITE } from "@/config/site";

/**
 * Coluna de texto do hero. A outra coluna do grid é o formulário de cadastro,
 * montado em `page.tsx`.
 *
 * Contém o único `<h1>` do site.
 */
export function HeroIntro() {
  return (
    <div className="rise">
      <h1 className="font-display text-3xl leading-[1.05] font-black sm:text-5xl">
        Minas não precisa de mais um político.{" "}
        <span className="text-primary">
          Precisa de gente disposta a trabalhar.
        </span>
      </h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
        Enquanto uns esperam a próxima eleição para aparecer, a gente constrói
        agora. Este é o kit de campanha que coloca você na linha de frente:
        artes, textos e roteiros prontos para levar a mensagem do {SITE.number}{" "}
        na sua cidade, no seu grupo, na sua rua.
      </p>
      <p className="mt-4 font-display text-lg font-black text-foreground sm:text-xl">
        É gratuito. É seu. E começa com um cadastro de 30 segundos.
      </p>
      <a
        href="#cadastro"
        className="cta-pulsante mt-7 block rounded-xl bg-primary px-6 py-4 text-center font-display text-lg font-black tracking-wide text-primary-foreground uppercase lg:hidden"
      >
        Quero meu material
      </a>
    </div>
  );
}
