import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";

vi.mock("server-only", () => ({}));

/** PEM PKCS#8 de verdade, do mesmo formato que o Google entrega no JSON. */
const REAL_PEM = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
}).privateKey as string;

/** O placeholder do `.env.example`: tem cabeçalho PEM, mas corpo de brinquedo. */
const PLACEHOLDER_PEM =
  "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBg...\\n-----END PRIVATE KEY-----\\n";

const VALID = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "lp@projeto.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: REAL_PEM,
  GOOGLE_SHEET_ID: "1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVwXyZ",
  GOOGLE_SHEET_TAB: "Leads",
  FORM_HMAC_SECRET: "a".repeat(64),
};

/** `getServerEnv` memoiza, então cada caso precisa de um módulo novo. */
async function loadEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  for (const key of Object.keys(VALID)) delete process.env[key];
  for (const [k, v] of Object.entries({ ...VALID, ...overrides })) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("@/lib/env");
}

const saved = { ...process.env };
beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...saved };
});

describe("getServerEnv", () => {
  it("aceita a private_key no formato que o JSON da service account entrega", async () => {
    const { getServerEnv } = await loadEnv({});
    const env = getServerEnv();
    expect(env.GOOGLE_PRIVATE_KEY).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(env.GOOGLE_PRIVATE_KEY.trimEnd()).toMatch(/-----END PRIVATE KEY-----$/);
  });

  it("desescapa os \\n de quem colou o valor direto do JSON no .env", async () => {
    const { getServerEnv } = await loadEnv({
      GOOGLE_PRIVATE_KEY: REAL_PEM.replace(/\n/g, "\\n"),
    });
    // várias linhas => o unescape aconteceu
    expect(getServerEnv().GOOGLE_PRIVATE_KEY.split("\n").length).toBeGreaterThan(5);
  });

  it("aceita o PEM inteiro em base64 (painéis que não aceitam quebra de linha)", async () => {
    const { getServerEnv } = await loadEnv({
      GOOGLE_PRIVATE_KEY: Buffer.from(REAL_PEM, "utf8").toString("base64"),
    });
    expect(getServerEnv().GOOGLE_PRIVATE_KEY).toMatch(/^-----BEGIN PRIVATE KEY-----/);
  });

  // Regressão: este placeholder já passou na validação e o app só quebrava
  // depois, no `DECODER routines::unsupported` do OpenSSL ao gravar.
  it("recusa o placeholder do .env.example, que tem cabeçalho PEM mas corpo curto", async () => {
    const { getServerEnv } = await loadEnv({ GOOGLE_PRIVATE_KEY: PLACEHOLDER_PEM });
    expect(() => getServerEnv()).toThrow(/placeholder/i);
  });

  it("diz 'está faltando' quando a variável nem existe", async () => {
    const { getServerEnv } = await loadEnv({ GOOGLE_SHEET_ID: undefined });
    expect(() => getServerEnv()).toThrow(/GOOGLE_SHEET_ID: está faltando/);
  });

  it("trata string vazia como ausente", async () => {
    const { getServerEnv } = await loadEnv({ GOOGLE_SHEET_ID: "   " });
    expect(() => getServerEnv()).toThrow(/GOOGLE_SHEET_ID: está faltando/);
  });

  it("nunca vaza o valor de uma variável na mensagem de erro", async () => {
    const segredo = "s3nh4-que-nao-pode-vazar-aaaaaaaaaaaaaaaaaaaaaa";
    const { getServerEnv } = await loadEnv({
      GOOGLE_PRIVATE_KEY: segredo,
      FORM_HMAC_SECRET: segredo,
    });
    try {
      getServerEnv();
      expect.unreachable("deveria ter lançado");
    } catch (error) {
      expect((error as Error).message).not.toContain(segredo);
    }
  });

  it("recusa e-mail que não é e-mail", async () => {
    const { getServerEnv } = await loadEnv({ GOOGLE_SERVICE_ACCOUNT_EMAIL: "não-é-email" });
    expect(() => getServerEnv()).toThrow(/GOOGLE_SERVICE_ACCOUNT_EMAIL/);
  });

  it("exige FORM_HMAC_SECRET com 32+ caracteres", async () => {
    const { getServerEnv } = await loadEnv({ FORM_HMAC_SECRET: "curto" });
    expect(() => getServerEnv()).toThrow(/FORM_HMAC_SECRET/);
  });
});

describe("isSheetsConfigured", () => {
  it("é true com tudo preenchido", async () => {
    const { isSheetsConfigured } = await loadEnv({});
    expect(isSheetsConfigured()).toBe(true);
  });

  it("é false com o placeholder — o dev precisa ver que ainda não está configurado", async () => {
    const { isSheetsConfigured } = await loadEnv({ GOOGLE_PRIVATE_KEY: PLACEHOLDER_PEM });
    expect(isSheetsConfigured()).toBe(false);
  });
});
