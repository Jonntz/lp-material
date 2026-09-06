/** Bloco editorial entre o hero e a lista de benefícios. */
export function Manifesto() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
      <span className="text-[0.7rem] font-bold tracking-[0.24em] text-primary-text uppercase">
        A verdade sem maquiagem
      </span>
      <h2 className="mt-4 font-display text-2xl leading-tight font-black sm:text-4xl">
        Campanha não se ganha com sorte. Se ganha com gente organizada.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
        Todo mundo reclama da política mineira. Poucos fazem algo além de
        reclamar. A diferença entre uma boa intenção e uma mudança real é
        simples: quem tem material na mão fala, e quem não tem fica calado.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
        É por isso que a campanha entrega o arsenal pronto. Você não precisa
        saber design, nem escrever texto, nem inventar argumento. Precisa apenas
        decidir que a sua cidade merece representação de verdade e apertar o
        botão abaixo.
      </p>
    </section>
  );
}
