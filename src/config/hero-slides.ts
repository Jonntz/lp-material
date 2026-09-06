import type { HeroSlide } from "@/components/hero-slideshow";

import fotoLp from "@/assets/foto-lp.jpg";
import fotoEncontro from "@/assets/foto-encontro-novo.jpg";
import fotoEntrevista from "@/assets/foto-entrevista.jpg";
import fotoCentroHistorico from "@/assets/foto-centro-historico.jpg";
import fotoSentado from "@/assets/foto-sentado.jpg";
import fotoRua from "@/assets/foto-rua.jpg";

import { SITE } from "@/config/site";

/**
 * Fotos da apresentação de slides do topo.
 *
 * Para acrescentar uma foto: jogue o arquivo em `src/assets/`, importe aqui e
 * some à lista. A ordem da lista é a ordem em que elas aparecem.
 *
 * `novo-logo.png` e as pastas `logo/` e `PNG/` são marca, não fotografia — não
 * entram aqui.
 *
 * Os `alt` descrevem a cena de cada uma em vez de repetir o nome do candidato:
 * quem usa leitor de tela já ouviu o nome no `<h1>` e nos textos ao redor, e
 * seis vezes "Matheus Biancardine" seria ruído.
 */
export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    src: fotoLp,
    alt: `${SITE.candidate}, candidato a ${SITE.role} por ${SITE.stateName}, em retrato de terno`,
  },
  {
    src: fotoCentroHistorico,
    alt: "Retrato ao ar livre, em frente a um prédio histórico",
  },
  {
    src: fotoEncontro,
    alt: "Discursando ao microfone no Encontro Nacional do Partido Novo",
  },
  {
    src: fotoRua,
    alt: "Retrato ao ar livre, em uma rua da cidade",
  },
  {
    src: fotoEntrevista,
    alt: "Sentado ao microfone, durante entrevista, com bandeiras ao fundo",
  },
  {
    src: fotoSentado,
    alt: "Retrato sentado, em ambiente aberto",
  },
];
