"use client";

/**
 * Autocomplete dos 853 municípios de Minas Gerais.
 *
 * A lista (`src/data/mg-cities.ts`, ~16 KB) fica **fora do bundle inicial**: só
 * é importada no primeiro `focus` do input, e o resultado é guardado num cache
 * de módulo para que uma segunda montagem do componente não reimporte nem
 * refaça o índice de busca.
 */

import * as React from "react";

import { cn } from "cn";

import { FIELD_INPUT_CLASS } from "@/lib/form-styles";

const MAX_SUGGESTIONS = 8;

type CityEntry = {
  /** Nome como será exibido e gravado, com acentos. */
  name: string;
  /** Mesmo nome sem acento e em minúsculas, para casar com o que foi digitado. */
  folded: string;
};

/**
 * Dobra acentos preservando o comprimento da string — diferente de
 * `foldAccents` (que também colapsa espaços), aqui os índices precisam bater
 * 1:1 com o nome original para o destaque em `<mark>` cair no lugar certo.
 */
function foldForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Cache de módulo: a lista é importada e indexada uma única vez por sessão. */
let citiesPromise: Promise<readonly CityEntry[]> | null = null;

function loadCities(): Promise<readonly CityEntry[]> {
  citiesPromise ??= import("@/data/mg-cities").then((mod) =>
    mod.MG_CITIES.map((name) => ({ name, folded: foldForSearch(name) })),
  );
  return citiesPromise;
}

/**
 * Casa por prefixo primeiro e só depois por substring, no máximo
 * `MAX_SUGGESTIONS` resultados. `"sao joa"` traz “São João del Rei”,
 * “São João Evangelista” e companhia antes de qualquer “Conceição…”.
 */
function filterCities(
  entries: readonly CityEntry[],
  query: string,
): readonly CityEntry[] {
  if (query.length === 0) return [];

  const prefixMatches: CityEntry[] = [];
  const substringMatches: CityEntry[] = [];

  for (const entry of entries) {
    const index = entry.folded.indexOf(query);
    if (index === 0) {
      prefixMatches.push(entry);
      // Já há prefixos suficientes: nenhuma substring entraria no corte.
      if (prefixMatches.length >= MAX_SUGGESTIONS) break;
    } else if (index > 0 && substringMatches.length < MAX_SUGGESTIONS) {
      substringMatches.push(entry);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, MAX_SUGGESTIONS);
}

/** Quebra o nome em [antes, trecho digitado, depois] para destacar o miolo. */
function highlightParts(
  entry: CityEntry,
  query: string,
): [string, string, string] | null {
  // Se a dobra mudou o comprimento (caso raro fora do português), não há como
  // mapear o índice de volta com segurança — melhor não destacar nada.
  if (entry.folded.length !== entry.name.length) return null;

  const index = entry.folded.indexOf(query);
  if (index < 0) return null;

  return [
    entry.name.slice(0, index),
    entry.name.slice(index, index + query.length),
    entry.name.slice(index + query.length),
  ];
}

type CityComboboxProps = {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  /** Encaminhado para o `<input>` — o formulário usa para focar o campo. */
  ref?: React.Ref<HTMLInputElement>;
};

export function CityCombobox({
  id,
  name,
  value,
  onValueChange,
  invalid,
  describedBy,
  placeholder = "Comece a digitar sua cidade",
  ref,
}: CityComboboxProps) {
  const [entries, setEntries] = React.useState<readonly CityEntry[] | null>(
    null,
  );
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const mountedRef = React.useRef(true);
  const requestedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const query = React.useMemo(
    () => foldForSearch(value).trim().replace(/\s+/g, " "),
    [value],
  );

  const suggestions = React.useMemo(
    () => (entries ? filterCities(entries, query) : []),
    [entries, query],
  );

  // A lista pode encolher entre renders (usuário digitou mais uma letra);
  // clampar aqui evita `aria-activedescendant` apontando para um id inexistente.
  const currentIndex = activeIndex < suggestions.length ? activeIndex : -1;
  const expanded = open && suggestions.length > 0;

  // Refs (e não estado) para que os handlers abaixo não sejam recriados a cada
  // render por causa da dependência.
  const ensureCitiesLoaded = React.useCallback(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void loadCities().then((loaded) => {
      if (mountedRef.current) setEntries(loaded);
    });
  }, []);

  // Carrega a lista só no primeiro foco — é isso que mantém os ~16 KB fora do
  // bundle inicial da página.
  const handleFocus = React.useCallback(() => {
    ensureCitiesLoaded();
    setOpen(true);
  }, [ensureCitiesLoaded]);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      ensureCitiesLoaded();
      onValueChange(event.target.value);
      setOpen(true);
      // Nada pré-selecionado: Enter sem seta continua submetendo o formulário.
      setActiveIndex(-1);
    },
    [ensureCitiesLoaded, onValueChange],
  );

  const selectAt = React.useCallback(
    (index: number) => {
      const entry = suggestions[index];
      if (!entry) return;
      onValueChange(entry.name);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onValueChange, suggestions],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown": {
          if (suggestions.length === 0) return;
          event.preventDefault();
          if (!open) {
            setOpen(true);
            setActiveIndex(0);
            return;
          }
          setActiveIndex((previous) => (previous + 1) % suggestions.length);
          return;
        }
        case "ArrowUp": {
          if (suggestions.length === 0) return;
          event.preventDefault();
          if (!open) {
            setOpen(true);
            setActiveIndex(suggestions.length - 1);
            return;
          }
          setActiveIndex((previous) =>
            previous <= 0 ? suggestions.length - 1 : previous - 1,
          );
          return;
        }
        case "Enter": {
          if (!expanded || currentIndex < 0) return;
          // Só engole o Enter quando há item ativo; senão o formulário submete.
          event.preventDefault();
          selectAt(currentIndex);
          return;
        }
        case "Escape": {
          if (!open) return;
          event.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
          return;
        }
        case "Tab": {
          setOpen(false);
          setActiveIndex(-1);
          return;
        }
        default:
          return;
      }
    },
    [currentIndex, expanded, open, selectAt, suggestions.length],
  );

  // Clique fora fecha. `pointerdown` (e não `click`) para fechar antes de o
  // ponteiro chegar em outro controle da página.
  React.useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        role="combobox"
        value={value}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="address-level2"
        autoCorrect="off"
        spellCheck={false}
        aria-expanded={expanded}
        aria-controls={expanded ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded && currentIndex >= 0 ? optionId(currentIndex) : undefined
        }
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={FIELD_INPUT_CLASS}
      />

      {expanded ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Cidades de Minas Gerais"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {suggestions.map((entry, index) => {
            const isActive = index === currentIndex;
            const parts = highlightParts(entry, query);

            return (
              <li
                key={entry.name}
                id={optionId(index)}
                role="option"
                aria-selected={isActive}
                // Segura o foco no input: sem isso o `pointerdown` tira o foco
                // e o clique nunca chega a selecionar.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => selectAt(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "cursor-pointer px-4 py-2.5 text-base",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-popover-foreground",
                )}
              >
                {parts ? (
                  <>
                    {parts[0]}
                    <mark
                      className={cn(
                        "bg-transparent font-semibold",
                        isActive ? "text-primary-foreground" : "text-primary-text",
                      )}
                    >
                      {parts[1]}
                    </mark>
                    {parts[2]}
                  </>
                ) : (
                  entry.name
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
