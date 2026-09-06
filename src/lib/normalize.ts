/**
 * Normalização de texto para busca e gravação.
 *
 * Nada aqui muda o que o usuário vê enquanto digita: `foldAccents` serve para
 * comparar (busca de cidade, validação), e `titleCaseName` só entra na hora de
 * gravar o lead.
 */

/** Partículas que ficam em minúsculas no meio de um nome próprio. */
const NAME_PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);

/** Colapsa espaços repetidos e apara as pontas. */
export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Minúsculas sem diacríticos, pronto para comparação.
 *
 * `"São João"` → `"sao joao"`
 */
export function foldAccents(value: string): string {
  return collapseSpaces(
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase(),
  );
}

/**
 * Capitalização de nome próprio, preservando as partículas em minúsculas.
 *
 * `"  maria  DAS graças de-souza  "` → `"Maria das Graças De-Souza"`
 *
 * Só é aplicada na gravação — enquanto o usuário digita, o valor fica exatamente
 * como ele escreveu (mexer no meio da digitação bagunça o cursor).
 */
export function titleCaseName(value: string): string {
  const words = collapseSpaces(value).split(" ");

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();

      // Partícula no meio do nome continua minúscula; na primeira posição não,
      // porque aí ela é o começo do nome ("Da Silva Neto").
      if (index > 0 && NAME_PARTICLES.has(foldAccents(lower))) {
        return lower;
      }

      // Capitaliza cada pedaço separado por hífen ou apóstrofo: "d'ávila" →
      // "D'Ávila", "jean-pierre" → "Jean-Pierre".
      return lower.replace(
        /(^|[-'’])(\p{L})/gu,
        (_match, boundary: string, letter: string) =>
          boundary + letter.toUpperCase(),
      );
    })
    .join(" ");
}
