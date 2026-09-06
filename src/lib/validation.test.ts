import { describe, expect, it } from "vitest";

import { leadSchema } from "@/lib/lead-schema";
import {
  FIELD_ORDER,
  type LeadInput,
  firstError,
  isMgCity,
  validateCityAgainst,
} from "@/lib/validation";

/** Amostra suficiente para os testes — a lista real tem 853 municípios. */
const CITIES = [
  "Belo Horizonte",
  "Betim",
  "Contagem",
  "Juiz de Fora",
  "Poços de Caldas",
  "São João del Rei",
  "São João Evangelista",
  "Uberlândia",
] as const;

const VALID: LeadInput = {
  nome: "João Silva",
  cidade: "Belo Horizonte",
  celular: "(31) 98362-6852",
  consentimento: true,
};

describe("FIELD_ORDER", () => {
  it("define a ordem de apresentação dos erros", () => {
    expect(FIELD_ORDER).toEqual(["nome", "cidade", "celular", "consentimento"]);
  });
});

describe("firstError — validação sequencial", () => {
  it("com nada preenchido, cobra o nome", () => {
    expect(firstError({}, { cities: CITIES })).toEqual({
      field: "nome",
      message: "Preencha seu nome completo.",
    });
  });

  it("com só o nome, avança para a cidade", () => {
    expect(firstError({ nome: "João Silva" }, { cities: CITIES })).toEqual({
      field: "cidade",
      message: "Informe sua cidade de Minas Gerais.",
    });
  });

  it("com nome e cidade válidos, avança para o celular", () => {
    expect(
      firstError(
        { nome: "João Silva", cidade: "Belo Horizonte" },
        { cities: CITIES },
      ),
    ).toEqual({
      field: "celular",
      message: "Informe seu número de celular.",
    });
  });

  it("com nome, cidade e celular válidos, avança para o consentimento", () => {
    expect(
      firstError(
        {
          nome: "João Silva",
          cidade: "Belo Horizonte",
          celular: "(31) 98362-6852",
        },
        { cities: CITIES },
      ),
    ).toEqual({
      field: "consentimento",
      message: "É preciso aceitar o uso dos seus dados para receber o material.",
    });
  });

  it("com tudo válido, devolve null", () => {
    expect(firstError(VALID, { cities: CITIES })).toBeNull();
  });

  it("mostra só o primeiro erro, mesmo com vários campos inválidos", () => {
    const result = firstError(
      { nome: "João", cidade: "São Paulo", celular: "123", consentimento: false },
      { cities: CITIES },
    );
    expect(result).toEqual({
      field: "nome",
      message: "Digite seu nome e sobrenome.",
    });
  });
});

describe("firstError — nome", () => {
  it("cobra o nome quando vem só espaços", () => {
    expect(firstError({ nome: "   " })?.field).toBe("nome");
    expect(firstError({ nome: "   " })?.message).toBe(
      "Preencha seu nome completo.",
    );
  });

  it("pede sobrenome quando só há um nome", () => {
    expect(firstError({ nome: "João" })?.message).toBe(
      "Digite seu nome e sobrenome.",
    );
  });

  it("não conta partícula como sobrenome", () => {
    expect(firstError({ nome: "João de" })?.message).toBe(
      "Digite seu nome e sobrenome.",
    );
  });

  it("aceita nome com partícula", () => {
    expect(firstError({ nome: "Ana de Sá" })?.field).not.toBe("nome");
    expect(firstError({ nome: "Maria das Graças Souza" })?.field).not.toBe(
      "nome",
    );
  });

  it("aceita hífen e apóstrofo", () => {
    expect(firstError({ nome: "Jean-Pierre D'Ávila" })?.field).not.toBe("nome");
    expect(firstError({ nome: "Ana Maria d’Ávila" })?.field).not.toBe("nome");
  });

  it("reprova nome com dígito", () => {
    expect(firstError({ nome: "João Silva 2" })?.message).toBe(
      "Use apenas letras no nome.",
    );
    expect(firstError({ nome: "Jo4o Silva" })?.message).toBe(
      "Use apenas letras no nome.",
    );
  });

  it("reprova nome com símbolo", () => {
    expect(firstError({ nome: "João <Silva>" })?.message).toBe(
      "Use apenas letras no nome.",
    );
  });

  it("reprova nome com mais de 80 caracteres", () => {
    const longName = `${"a".repeat(45)} ${"b".repeat(45)}`;
    expect(firstError({ nome: longName })?.field).toBe("nome");
    expect(firstError({ nome: longName })?.message).toBe(
      "Use no máximo 80 caracteres no nome.",
    );
  });
});

describe("firstError — cidade", () => {
  const base = { nome: "João Silva" };

  it("reprova cidade fora de Minas Gerais", () => {
    expect(
      firstError({ ...base, cidade: "São Paulo" }, { cities: CITIES }),
    ).toEqual({
      field: "cidade",
      message: "Selecione uma cidade de Minas Gerais na lista.",
    });
  });

  it("aceita cidade de MG mesmo sem acento ou caixa correta", () => {
    expect(
      firstError({ ...base, cidade: "sao joao del rei" }, { cities: CITIES })
        ?.field,
    ).not.toBe("cidade");
    expect(
      firstError({ ...base, cidade: "UBERLANDIA" }, { cities: CITIES })?.field,
    ).not.toBe("cidade");
  });

  it("pula a checagem de pertencimento quando a lista não é passada", () => {
    expect(firstError({ ...base, cidade: "São Paulo" })?.field).not.toBe(
      "cidade",
    );
  });

  it("continua obrigatória mesmo sem a lista", () => {
    expect(firstError({ ...base, cidade: "  " })).toEqual({
      field: "cidade",
      message: "Informe sua cidade de Minas Gerais.",
    });
  });
});

describe("firstError — celular", () => {
  const base = { nome: "João Silva", cidade: "Belo Horizonte" };

  it("reprova celular incompleto", () => {
    expect(firstError({ ...base, celular: "(31) 9836" }, { cities: CITIES })).toEqual(
      {
        field: "celular",
        message: "Digite um celular válido com DDD, ex.: (31) 98362-6852.",
      },
    );
  });

  it("reprova telefone fixo", () => {
    expect(
      firstError({ ...base, celular: "1133334444" }, { cities: CITIES })?.field,
    ).toBe("celular");
  });
});

describe("firstError — consentimento", () => {
  it("reprova consentimento falso", () => {
    expect(firstError({ ...VALID, consentimento: false })).toEqual({
      field: "consentimento",
      message: "É preciso aceitar o uso dos seus dados para receber o material.",
    });
  });

  it("reprova consentimento ausente", () => {
    expect(
      firstError({
        nome: VALID.nome,
        cidade: VALID.cidade,
        celular: VALID.celular,
      })?.field,
    ).toBe("consentimento");
  });
});

describe("isMgCity", () => {
  it("compara sem acento e sem caixa", () => {
    expect(isMgCity("belo horizonte", CITIES)).toBe(true);
    expect(isMgCity("POÇOS DE CALDAS", CITIES)).toBe(true);
    expect(isMgCity("  Uberlandia  ", CITIES)).toBe(true);
  });

  it("recusa cidade de fora e string vazia", () => {
    expect(isMgCity("São Paulo", CITIES)).toBe(false);
    expect(isMgCity("", CITIES)).toBe(false);
    expect(isMgCity("Belo", CITIES)).toBe(false);
  });
});

describe("validateCityAgainst", () => {
  it("devolve null para cidade válida", () => {
    expect(validateCityAgainst(CITIES)("Betim")).toBeNull();
  });

  it("devolve a mensagem de obrigatoriedade para vazio", () => {
    expect(validateCityAgainst(CITIES)("")).toBe(
      "Informe sua cidade de Minas Gerais.",
    );
  });

  it("devolve a mensagem de lista para cidade de fora", () => {
    expect(validateCityAgainst(CITIES)("Santos")).toBe(
      "Selecione uma cidade de Minas Gerais na lista.",
    );
  });
});

describe("leadSchema", () => {
  it("normaliza a saída para gravação", () => {
    const parsed = leadSchema.parse({
      nome: "  joão  DA silva  ",
      cidade: "  Belo   Horizonte ",
      celular: "+55 (31) 98362-6852",
      consentimento: true,
    });

    expect(parsed).toEqual({
      nome: "João da Silva",
      cidade: "Belo Horizonte",
      celular: "31983626852",
      consentimento: true,
    });
  });

  it("reprova o lead inteiro quando um campo é inválido", () => {
    expect(
      leadSchema.safeParse({ ...VALID, celular: "1133334444" }).success,
    ).toBe(false);
  });
});
