import { ImageResponse } from "next/og";

import { SITE } from "@/config/site";

export const alt = `${SITE.candidate} ${SITE.number} — ${SITE.role} por ${SITE.stateName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem de compartilhamento gerada no build.
 *
 * Tipográfica de propósito: reproduz a linguagem da identidade visual (navy,
 * verde vivo, tipo pesado) sem depender de processar a foto de 2,3 MB.
 *
 * A fonte é baixada em tempo de build; se a rede falhar, cai na fonte padrão
 * do renderizador em vez de quebrar o build.
 */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@900&display=swap",
      {
        headers: {
          // O user-agent decide o formato devolvido; este garante TTF, que o
          // renderizador do next/og aceita (woff2 não é suportado).
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
        },
        signal: AbortSignal.timeout(8000),
      },
    ).then((res) => res.text());

    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;

    return await fetch(url, { signal: AbortSignal.timeout(8000) }).then((res) =>
      res.arrayBuffer(),
    );
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const fontData = await loadDisplayFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#012E40",
          padding: "64px 72px",
          fontFamily: fontData ? "Exo 2" : "sans-serif",
        }}
      >
        {/* faixas diagonais da identidade visual */}
        <div
          style={{
            position: "absolute",
            top: -240,
            right: -160,
            width: 620,
            height: 1100,
            display: "flex",
            transform: "rotate(34deg)",
          }}
        >
          <div style={{ width: 120, height: "100%", background: "#03738C" }} />
          <div style={{ width: 90, height: "100%", background: "#11A837" }} />
          <div style={{ width: 130, height: "100%", background: "#29EA28" }} />
          <div style={{ width: 60, height: "100%", background: "#EBE438" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 12,
              color: "#29EA28",
              textTransform: "uppercase",
              fontWeight: 900,
            }}
          >
            {SITE.role}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 250,
              lineHeight: 1,
              color: "#F1F8FA",
              fontWeight: 900,
              letterSpacing: -10,
              marginTop: 8,
            }}
          >
            {SITE.number}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              color: "#29EA28",
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {SITE.candidate}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 760,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34,
              color: "#F1F8FA",
              fontWeight: 700,
            }}
          >
            Material de campanha gratuito
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9FC3CE" }}>
            {`Artes, textos e roteiros prontos para as ${SITE.cityCount} cidades de ${SITE.stateName} · ${SITE.party}`}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              { name: "Exo 2", data: fontData, style: "normal", weight: 900 },
            ],
          }
        : {}),
    },
  );
}
