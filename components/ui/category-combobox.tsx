"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  flattenTaxonomyOptions,
  labelForSelection,
  type TaxonomyCategory,
  type TaxonomySelection,
} from "@/lib/catalog-taxonomy";
import { ChevronDown } from "lucide-react";

type CategoryComboboxProps = {
  categories: TaxonomyCategory[];
  value: TaxonomySelection | null;
  onChange: (value: TaxonomySelection | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  id?: string;
};

export function CategoryCombobox({
  categories,
  value,
  onChange,
  disabled = false,
  required = false,
  label = "Categoría y subcategoría",
  hint,
  id,
}: CategoryComboboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(
    () => flattenTaxonomyOptions(categories),
    [categories]
  );

  const selectedLabel = labelForSelection(categories, value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((opt) => opt.searchText.includes(q))
      .slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const displayValue = open ? query : (selectedLabel ?? "");

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <Label htmlFor={inputId}>
        {label}
        {required && " *"}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          required={false}
          placeholder="Buscá por categoría o producto (ej. fideos, harina…)"
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
      {hint && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
        >
          {filtered.map((opt) => {
            const active =
              value?.categoryId === opt.categoryId &&
              value?.subcategoryId === opt.subcategoryId;
            return (
              <li key={`${opt.categoryId}-${opt.subcategoryId}`} role="presentation">
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
                      onChange({
                        categoryId: opt.categoryId,
                        subcategoryId: opt.subcategoryId,
                      });
                      setQuery("");
                      setOpen(false);
                    }
                  }}
                  onClick={() => {
                    onChange({
                      categoryId: opt.categoryId,
                      subcategoryId: opt.subcategoryId,
                    });
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="text-[var(--color-brown)]">{opt.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-muted-foreground)] shadow-lg">
          Sin resultados. Probá otro término o elegí Otros › Otros.
        </div>
      )}
    </div>
  );
}
