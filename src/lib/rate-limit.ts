/**
 * Rate limit em memória, sem dependência externa.
 *
 * ## Limitação honesta
 *
 * O contador vive **na memória do processo**. Em serverless (Vercel, Cloud Run,
 * Lambda) cada instância tem o seu próprio mapa e as instâncias não conversam
 * entre si: com N instâncias quentes, o limite efetivo é `limit × N`, e um
 * deploy ou um cold start zera tudo. **Isto não é um limite global.**
 *
 * Ainda assim vale o custo (zero): segura o caso comum — a mesma pessoa
 * clicando várias vezes e o script bobo que dispara em rajada de um IP só —
 * como primeira barreira, combinada com o honeypot e o timestamp assinado
 * (`src/lib/form-token.ts`), que atacam o problema por outro ângulo.
 *
 * Se um dia precisar de limite global de verdade, trocar a implementação por
 * Redis/Upstash (`@upstash/ratelimit`) mantendo esta mesma assinatura — nenhum
 * chamador precisa mudar.
 */

/** Tentativas permitidas por chave dentro da janela. */
const DEFAULT_LIMIT = 5;

/** Tamanho da janela deslizante: 10 minutos. */
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Teto de chaves guardadas. Sem isto, um atacante rodando IPs diferentes faria
 * o mapa crescer sem parar — vazamento de memória disfarçado de proteção.
 */
const MAX_KEYS = 5000;

export type RateLimitOptions = {
  /** Tentativas permitidas na janela. Padrão: 5. */
  limit?: number;
  /** Tamanho da janela em milissegundos. Padrão: 10 minutos. */
  windowMs?: number;
};

export type RateLimitResult = {
  /** `false` quando a tentativa deve ser recusada. */
  allowed: boolean;
  /** Quantas tentativas ainda cabem na janela atual. */
  remaining: number;
  /** Quanto falta (ms) para liberar a próxima. `0` quando permitido. */
  retryAfterMs: number;
};

/**
 * Timestamps das tentativas recentes por chave, em ordem crescente.
 *
 * A ordem de inserção do `Map` também é a ordem de descarte: cada acesso
 * reinsere a chave no fim, então as primeiras posições são sempre as mais
 * antigas (LRU pobre, porém suficiente).
 */
const hitsByKey = new Map<string, number[]>();

/** Descarta as chaves mais antigas até caber no teto. */
function evictOldest(): void {
  while (hitsByKey.size > MAX_KEYS) {
    const oldestKey = hitsByKey.keys().next().value;
    if (oldestKey === undefined) return;
    hitsByKey.delete(oldestKey);
  }
}

/**
 * Registra uma tentativa para `key` e diz se ela pode passar.
 *
 * Janela deslizante: guarda o instante de cada tentativa e descarta as que já
 * saíram da janela. Tentativa bloqueada **não** é contabilizada, então marretar
 * o botão não empurra a liberação para frente.
 */
export function rateLimit(
  key: string,
  opts?: RateLimitOptions,
): RateLimitResult {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const cutoff = now - windowMs;

  const recent = (hitsByKey.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );

  // Reinsere no fim do Map para marcar a chave como recém-usada.
  hitsByKey.delete(key);

  if (recent.length >= limit) {
    hitsByKey.set(key, recent);
    evictOldest();
    return {
      allowed: false,
      remaining: 0,
      // A mais antiga é a primeira a sair da janela.
      retryAfterMs: Math.max(0, recent[0] + windowMs - now),
    };
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  evictOldest();

  return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
}

/** Zera o estado. Existe para os testes — não use em código de produção. */
export function resetRateLimit(): void {
  hitsByKey.clear();
}
