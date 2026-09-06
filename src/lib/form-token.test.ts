import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Definido antes de qualquer chamada: o módulo lê o segredo na hora de assinar,
// não no import.
process.env.FORM_HMAC_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

import { issueFormToken, verifyFormToken } from "@/lib/form-token";

const MIN_AGE_MS = 3000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

describe("form token", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emite no formato `timestamp.assinatura`", () => {
    const [issuedAt, signature] = issueFormToken().split(".");

    expect(issuedAt).toBe(String(Date.now()));
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it("aceita o token depois do tempo mínimo", () => {
    const token = issueFormToken();

    vi.advanceTimersByTime(MIN_AGE_MS);
    expect(verifyFormToken(token)).toEqual({ valid: true });

    vi.advanceTimersByTime(60_000);
    expect(verifyFormToken(token)).toEqual({ valid: true });
  });

  it("recusa envio rápido demais", () => {
    const token = issueFormToken();

    expect(verifyFormToken(token)).toEqual({
      valid: false,
      reason: "too-fast",
    });

    vi.advanceTimersByTime(MIN_AGE_MS - 1);
    expect(verifyFormToken(token)).toEqual({
      valid: false,
      reason: "too-fast",
    });
  });

  it("respeita um minAgeMs customizado", () => {
    const token = issueFormToken();

    vi.advanceTimersByTime(500);
    expect(verifyFormToken(token, { minAgeMs: 100 })).toEqual({ valid: true });
  });

  it("recusa token expirado", () => {
    const token = issueFormToken();

    vi.advanceTimersByTime(MAX_AGE_MS);
    expect(verifyFormToken(token)).toEqual({ valid: true });

    vi.advanceTimersByTime(1);
    expect(verifyFormToken(token)).toEqual({ valid: false, reason: "expired" });
  });

  it("recusa assinatura adulterada", () => {
    const token = issueFormToken();
    vi.advanceTimersByTime(MIN_AGE_MS);

    const [issuedAt, signature] = token.split(".");
    const flippedChar = signature[0] === "a" ? "b" : "a";
    const tampered = `${issuedAt}.${flippedChar}${signature.slice(1)}`;

    expect(verifyFormToken(tampered)).toEqual({
      valid: false,
      reason: "bad-signature",
    });
  });

  it("recusa timestamp adulterado para escapar do minAgeMs", () => {
    const token = issueFormToken();
    const [, signature] = token.split(".");

    // O bot recuaria o relógio para fingir que esperou.
    const backdated = `${Date.now() - 60_000}.${signature}`;

    expect(verifyFormToken(backdated)).toEqual({
      valid: false,
      reason: "bad-signature",
    });
  });

  it("recusa token assinado com outro segredo", () => {
    const issuedAt = String(Date.now());
    const forged = `${issuedAt}.${createHmac("sha256", "outro-segredo-qualquer-com-32-caracteres")
      .update(issuedAt)
      .digest("hex")}`;

    vi.advanceTimersByTime(MIN_AGE_MS);
    expect(verifyFormToken(forged)).toEqual({
      valid: false,
      reason: "bad-signature",
    });
  });

  it("recusa token malformado", () => {
    const malformed = [
      "",
      "sem-ponto",
      "1.2.3",
      "abc.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd",
      `${Date.now()}.assinatura-curta`,
      `${Date.now()}.${"Z".repeat(64)}`,
    ];

    for (const token of malformed) {
      expect(verifyFormToken(token)).toEqual({
        valid: false,
        reason: "malformed",
      });
    }
  });

  it("trata token do futuro como rápido demais", () => {
    const future = String(Date.now() + 60_000);
    const signature = createHmac(
      "sha256",
      process.env.FORM_HMAC_SECRET as string,
    )
      .update(future)
      .digest("hex");

    expect(verifyFormToken(`${future}.${signature}`)).toEqual({
      valid: false,
      reason: "too-fast",
    });
  });
});
