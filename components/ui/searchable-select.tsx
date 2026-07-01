"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  disabled = false,
  label,
  placeholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  id,
}: SearchableSelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const text = (opt.searchText ?? opt.label).toLowerCase();
      return text.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const displayValue = open ? query : selectedLabel;

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (selectedLabel && !query) setQuery("");
          }}
          className="pr-10"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
      </div>
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
        >
          {filtered.map((opt) => {
            const active = value === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <div
                  role="option"
                  aria-selected={active}
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer px-3 py-2.5 text-sm hover:bg-[var(--color-brand-cream)]",
                    active && "bg-[var(--color-brand-cream)] font-medium"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(opt.value);
                      setQuery("");
                      setOpen(false);
                    }
                  }}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-muted-foreground)] shadow-lg">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
