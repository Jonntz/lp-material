/**
 * Preenche as variáveis do Google Sheets no `.env.local` a partir do JSON da
 * service account.
 *
 *   pnpm setup:google ~/Downloads/meu-projeto-abc123.json
 *   pnpm setup:google ~/Downloads/chave.json --sheet-url "https://docs.google.com/spreadsheets/d/ID/edit"
 *
 * Existe porque a `private_key` tem várias linhas e copiar à mão para o `.env`
 * quase sempre quebra o escape dos `\n` — o sintoma é um
 * `DECODER routines::unsupported` do OpenSSL só na hora de gravar.
 *
 * Nada do conteúdo da chave é impresso no terminal.
 */
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { resolve } from "node:path";

const ENV_PATH = resolve(process.cwd(), ".env.local");

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const jsonPath = args.find((a) => !a.startsWith("--"));
const sheetArgIndex = args.indexOf("--sheet-url");
const sheetArg = sheetArgIndex >= 0 ? args[sheetArgIndex + 1] : undefined;

if (!jsonPath) {
  fail(
    "Passe o caminho do JSON da service account.\n" +
      "  Exemplo: pnpm setup:google ~/Downloads/minha-chave.json",
  );
}
if (!existsSync(jsonPath)) fail(`Arquivo não encontrado: ${jsonPath}`);

let credentials: Record<string, unknown>;
try {
  credentials = JSON.parse(readFileSync(jsonPath, "utf8"));
} catch {
  fail(`${jsonPath} não é um JSON válido.`);
}

if (credentials.type !== "service_account") {
  fail(
    `Esse JSON tem "type": "${String(credentials.type)}".\n` +
      "  Baixe a chave de uma **conta de serviço** (Service Account), não de um OAuth client.",
  );
}

const email = String(credentials.client_email ?? "");
const privateKey = String(credentials.private_key ?? "");

if (!email.includes("@")) fail("O JSON não tem `client_email`.");
if (!privateKey.includes("BEGIN PRIVATE KEY")) {
  fail("O JSON não tem uma `private_key` no formato PEM.");
}

/** Extrai o ID da planilha, aceitando a URL inteira ou só o ID. */
function readSheetId(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const fromUrl = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (fromUrl) return fromUrl[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
  fail(`Não consegui extrair o ID da planilha de: ${input}`);
}

const sheetId = readSheetId(sheetArg);

// `\n` reais viram `\n` literais para caber numa linha do .env
const escapedKey = privateKey.replace(/\n/g, "\\n");

const updates: Record<string, string> = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: email,
  GOOGLE_PRIVATE_KEY: escapedKey,
};
if (sheetId) updates.GOOGLE_SHEET_ID = sheetId;

const original = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
let next = original;

for (const [key, value] of Object.entries(updates)) {
  const line = `${key}="${value}"`;
  // casa a linha inteira, mesmo quando o valor antigo tinha aspas
  const pattern = new RegExp(`^${key}=.*$`, "m");
  next = pattern.test(next) ? next.replace(pattern, line) : `${next.trimEnd()}\n${line}\n`;
}

writeFileSync(ENV_PATH, next.endsWith("\n") ? next : `${next}\n`);
// O arquivo passa a conter uma chave privada: só o dono lê.
chmodSync(ENV_PATH, 0o600);

console.log("\n✓ .env.local atualizado (permissões 600)\n");
console.log("  GOOGLE_SERVICE_ACCOUNT_EMAIL  " + email);
console.log("  GOOGLE_PRIVATE_KEY            gravada, " + privateKey.length + " caracteres");
console.log(
  "  GOOGLE_SHEET_ID               " +
    (sheetId ?? "NÃO definido — rode de novo com --sheet-url, ou edite à mão"),
);

console.log("\n── falta 1 passo, e ele é obrigatório ──");
console.log("  Abra a planilha no navegador → botão Compartilhar → cole este e-mail");
console.log("  como EDITOR:\n");
console.log("      " + email + "\n");
console.log("  Sem isso a API responde 403, mesmo com as credenciais certas.\n");
