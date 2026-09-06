import { describe, expect, it } from "vitest";

import { collapseSpaces, foldAccents, titleCaseName } from "@/lib/normalize";

describe("collapseSpaces", () => {
  it("colapsa espaços repetidos e apara as pontas", () => {
    expect(collapseSpaces("  Belo   Horizonte  ")).toBe("Belo Horizonte");
  });

  it("trata quebras de linha e tabs como espaço", () => {
    expect(collapseSpaces("Sete\tLagoas\n")).toBe("Sete Lagoas");
  });

  it("devolve string vazia para só espaços", () => {
    expect(collapseSpaces("   ")).toBe("");
  });
});

describe("foldAccents", () => {
  it("remove acentos e baixa a caixa", () => {
    expect(foldAccents("São João")).toBe("sao joao");
  });

  it("normaliza o cedilha", () => {
    expect(foldAccents("AÇUCENA")).toBe("acucena");
  });

  it("cobre os acentos comuns do português", () => {
    expect(foldAccents("Abaeté Poços Água Pará Guaraciaba")).toBe(
      "abaete pocos agua para guaraciaba",
    );
  });

  it("colapsa espaços junto", () => {
    expect(foldAccents("  São   João del Rei ")).toBe("sao joao del rei");
  });

  it("é idempotente", () => {
    expect(foldAccents(foldAccents("Divinópolis"))).toBe("divinopolis");
  });
});

describe("titleCaseName", () => {
  it("capitaliza nome e sobrenome", () => {
    expect(titleCaseName("joão silva")).toBe("João Silva");
  });

  it("baixa a caixa de nomes gritados", () => {
    expect(titleCaseName("MARIA DAS GRAÇAS")).toBe("Maria das Graças");
  });

  it("mantém as partículas em minúsculas no meio do nome", () => {
    expect(titleCaseName("ana DE souza DOS santos e silva")).toBe(
      "Ana de Souza dos Santos e Silva",
    );
  });

  it("capitaliza a partícula quando ela abre o nome", () => {
    expect(titleCaseName("da silva neto")).toBe("Da Silva Neto");
  });

  it("capitaliza os dois lados do hífen e do apóstrofo", () => {
    expect(titleCaseName("jean-pierre d'ávila")).toBe("Jean-Pierre D'Ávila");
  });

  it("normaliza espaços de sobra", () => {
    expect(titleCaseName("  matheus   biancardine  ")).toBe(
      "Matheus Biancardine",
    );
  });
});
