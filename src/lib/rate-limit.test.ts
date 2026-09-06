import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimit();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimit();
  });

  it("permite até o limite e bloqueia a tentativa seguinte", () => {
    const opts = { limit: 3, windowMs: 1000 };

    expect(rateLimit("ip-a", opts)).toMatchObject({
      allowed: true,
      remaining: 2,
    });
    expect(rateLimit("ip-a", opts)).toMatchObject({
      allowed: true,
      remaining: 1,
    });
    expect(rateLimit("ip-a", opts)).toMatchObject({
      allowed: true,
      remaining: 0,
    });

    const blocked = rateLimit("ip-a", opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("usa o padrão de 5 tentativas quando não recebe opções", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(rateLimit("ip-padrao").allowed).toBe(true);
    }
    expect(rateLimit("ip-padrao").allowed).toBe(false);
  });

  it("libera depois que a janela passa", () => {
    const opts = { limit: 2, windowMs: 1000 };

    expect(rateLimit("ip-b", opts).allowed).toBe(true);
    expect(rateLimit("ip-b", opts).allowed).toBe(true);
    expect(rateLimit("ip-b", opts).allowed).toBe(false);

    vi.advanceTimersByTime(999);
    expect(rateLimit("ip-b", opts).allowed).toBe(false);

    vi.advanceTimersByTime(1);
    expect(rateLimit("ip-b", opts).allowed).toBe(true);
  });

  it("libera aos poucos, como janela deslizante", () => {
    const opts = { limit: 2, windowMs: 1000 };

    rateLimit("ip-c", opts); // t = 0
    vi.advanceTimersByTime(600);
    rateLimit("ip-c", opts); // t = 600
    expect(rateLimit("ip-c", opts).allowed).toBe(false);

    // Em t = 1000 só a primeira tentativa saiu da janela: abre uma vaga, não duas.
    vi.advanceTimersByTime(400);
    expect(rateLimit("ip-c", opts).allowed).toBe(true);
    expect(rateLimit("ip-c", opts).allowed).toBe(false);
  });

  it("informa quanto falta para liberar", () => {
    const opts = { limit: 1, windowMs: 10_000 };

    rateLimit("ip-d", opts);
    vi.advanceTimersByTime(4000);

    expect(rateLimit("ip-d", opts).retryAfterMs).toBe(6000);
  });

  it("conta cada chave separadamente", () => {
    const opts = { limit: 1, windowMs: 1000 };

    expect(rateLimit("ip-e", opts).allowed).toBe(true);
    expect(rateLimit("ip-e", opts).allowed).toBe(false);

    // Outro IP não herda o bloqueio do vizinho.
    expect(rateLimit("ip-f", opts).allowed).toBe(true);
    expect(rateLimit("ip-f", opts).allowed).toBe(false);
  });

  it("não empurra a liberação para frente quando a pessoa insiste", () => {
    const opts = { limit: 1, windowMs: 1000 };

    rateLimit("ip-g", opts);
    vi.advanceTimersByTime(500);
    rateLimit("ip-g", opts); // bloqueada — não deve contar
    vi.advanceTimersByTime(500);

    expect(rateLimit("ip-g", opts).allowed).toBe(true);
  });

  it("resetRateLimit zera o estado", () => {
    const opts = { limit: 1, windowMs: 1000 };

    rateLimit("ip-h", opts);
    expect(rateLimit("ip-h", opts).allowed).toBe(false);

    resetRateLimit();
    expect(rateLimit("ip-h", opts).allowed).toBe(true);
  });
});
