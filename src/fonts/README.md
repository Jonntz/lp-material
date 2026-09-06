# Fontes — Neo Sans Std

A identidade visual (`IDENTIDADE VISUAL MATHEUS BIANCARDINE.pdf`, pág. 4) define **Neo Sans**
como tipografia da marca. Os `.otf` originais estão nesta pasta.

## O que o site realmente carrega

Os `.otf` **não** são servidos: eles têm ~70 KB cada e carregam glifos que o site nunca usa.
O que vai para o navegador são os `.woff2` com subset latin, ~15 KB por peso:

```
NeoSans-Regular.woff2   400
NeoSans-Medium.woff2    500
NeoSans-Bold.woff2      700
NeoSans-Black.woff2     900   ← o "3055", os títulos e os CTAs
```

Nenhum itálico é declarado, porque o layout não usa nenhum.

## Regenerar os .woff2

Precisa de `fonttools` e `brotli` (`pip install fonttools brotli`):

```bash
cd src/fonts
python3 -m fontTools.subset "Neo Sans Std Regular.otf" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --layout-features=kern,liga,clig,calt,ccmp,locl \
  --flavor=woff2 --desubroutinize \
  --output-file=NeoSans-Regular.woff2
```

Repita trocando `Regular` por `Medium`, `Bold` e `Black`. A faixa de unicode é a mesma que o
Google Fonts chama de `latin` — cobre o português inteiro. **Não** inclua `latin-ext`: nenhum
caractere do site passa de U+00FF, e incluir só engorda o arquivo.

## Quer o número ainda mais pesado?

`Neo Sans Std Ultra.otf` é um degrau acima do Black. O Black foi escolhido por ficar mais
próximo do peso do site de referência (que usava Archivo Black). Para trocar: gere
`NeoSans-Ultra.woff2` com o mesmo comando e aponte o peso 900 para ele em `src/lib/fonts.ts`.

## Atenção à licença

Licenças desktop do Neo Sans normalmente **não** cobrem incorporação em site (webfont).
Vale conferir a sua licença Monotype antes de publicar.
