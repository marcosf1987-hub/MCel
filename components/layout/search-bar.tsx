"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchResult {
  type: string;
  label: string;
  href: string;
}

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const text = await res.text();
        if (!text.startsWith("{")) return;
        const data = JSON.parse(text) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/productos?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-[var(--color-neutral)] ${
            compact ? "left-2.5 h-3.5 w-3.5" : "left-4 h-4 w-4"
          }`}
        />
        <Input
          className={`rounded-full border-[var(--color-border)] bg-[var(--color-secondary)] focus:bg-white ${
            compact ? "h-9 pl-8 text-sm" : "pl-11"
          }`}
          placeholder={
            compact ? "Buscar…" : "Buscar marca, categoría o producto..."
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </form>
      {open && results.length > 0 && (
        <ul className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-brand-cream)]"
                onMouseDown={() => {
                  router.push(r.href);
                  setOpen(false);
                }}
              >
                <span className="text-xs font-medium text-[var(--color-accent)]">{r.type}</span>
                <br />
                <span className="text-[var(--color-brown)]">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
