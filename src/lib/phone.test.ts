import { describe, expect, it } from "vitest";

import {
  PHONE_MAX_LENGTH,
  VALID_DDDS,
  formatPhone,
  isValidMobile,
  unformatPhone,
} from "@/lib/phone";

describe("formatPhone — máscara progressiva", () => {
  it("aplica a máscara dígito a dígito", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("3")).toBe("(3");
    expect(formatPhone("31")).toBe("(31)");
    expect(formatPhone("319")).toBe("(31) 9");
    expect(formatPhone("3198")).toBe("(31) 98");
    expect(formatPhone("31983")).toBe("(31) 983");
    expect(formatPhone("319836")).toBe("(31) 9836");
    expect(formatPhone("3198362")).toBe("(31) 98362");
    expect(formatPhone("31983626")).toBe("(31) 98362-6");
    expect(formatPhone("319836268")).toBe("(31) 98362-68");
    expect(formatPhone("3198362685")).toBe("(31) 98362-685");
    expect(formatPhone("31983626852")).toBe("(31) 98362-6852");
  });

  it("ignora caracteres que não são dígitos", () => {
    expect(formatPhone("(31) 98362-6852")).toBe("(31) 98362-6852");
    expect(formatPhone("31 9 8362 6852")).toBe("(31) 98362-6852");
    expect(formatPhone("abc31def98362ghi6852")).toBe("(31) 98362-6852");
  });

  it("corta em 11 dígitos", () => {
    expect(formatPhone("31983626852999")).toBe("(31) 98362-6852");
  });

  it("remove o DDI 55 de valores colados", () => {
    expect(formatPhone("5531983626852")).toBe("(31) 98362-6852");
    expect(formatPhone("+55 (31) 98362-6852")).toBe("(31) 98362-6852");
    // 12 dígitos: DDI + DDD + 8 dígitos (fixo).
    expect(formatPhone("553133334444")).toBe("(31) 33334-444");
  });

  it("não confunde o DDD 55 com o DDI", () => {
    expect(formatPhone("55984443333")).toBe("(55) 98444-3333");
  });

  it("respeita PHONE_MAX_LENGTH", () => {
    expect(formatPhone("31983626852")).toHaveLength(PHONE_MAX_LENGTH);
    expect(PHONE_MAX_LENGTH).toBe(15);
  });

  it("é determinística e idempotente", () => {
    expect(formatPhone(formatPhone("31983626852"))).toBe("(31) 98362-6852");
  });
});

describe("unformatPhone", () => {
  it("devolve só os dígitos", () => {
    expect(unformatPhone("(31) 98362-6852")).toBe("31983626852");
    expect(unformatPhone("")).toBe("");
    expect(unformatPhone("abc")).toBe("");
  });
});

describe("isValidMobile", () => {
  it("aceita um celular válido, formatado ou não", () => {
    expect(isValidMobile("(31) 98362-6852")).toBe(true);
    expect(isValidMobile("31983626852")).toBe(true);
    expect(isValidMobile("+55 31 98362-6852")).toBe(true);
  });

  it("rejeita telefone fixo (8 dígitos, sem o nono dígito)", () => {
    expect(isValidMobile("1133334444")).toBe(false);
    expect(isValidMobile("(31) 3333-4444")).toBe(false);
  });

  it("rejeita DDD inexistente", () => {
    expect(isValidMobile("(00) 99999-9999")).toBe(false);
    expect(isValidMobile("(20) 98362-6852")).toBe(false);
    expect(isValidMobile("(23) 98362-6852")).toBe(false);
  });

  it("rejeita quando o nono dígito não é 9", () => {
    expect(isValidMobile("(31) 88362-6852")).toBe(false);
  });

  it("rejeita dígitos todos repetidos", () => {
    expect(isValidMobile("99999999999")).toBe(false);
    expect(isValidMobile("11111111111")).toBe(false);
  });

  it("rejeita número curto ou vazio", () => {
    expect(isValidMobile("")).toBe(false);
    expect(isValidMobile("319836268")).toBe(false);
    expect(isValidMobile("(31) 98362-685")).toBe(false);
  });

  it("rejeita número longo demais que não seja DDI 55", () => {
    expect(isValidMobile("319836268521")).toBe(false);
  });
});

describe("VALID_DDDS", () => {
  it("tem os 67 DDDs em uso no Brasil", () => {
    expect(VALID_DDDS.size).toBe(67);
  });

  it("inclui os DDDs de Minas Gerais", () => {
    for (const ddd of ["31", "32", "33", "34", "35", "37", "38"]) {
      expect(VALID_DDDS.has(ddd)).toBe(true);
    }
  });

  it("não inclui as lacunas do plano de numeração", () => {
    for (const ddd of ["00", "10", "20", "23", "25", "26", "29", "30", "36", "39", "40", "50", "52", "56", "60", "70", "72", "76", "78", "80", "90"]) {
      expect(VALID_DDDS.has(ddd)).toBe(false);
    }
  });
});
