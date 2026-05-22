"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GLUTEN_LABELS, type GlutenCertification } from "@/types/database";

const CERT_OPTIONS = Object.entries(GLUTEN_LABELS) as [GlutenCertification, string][];

export function CertFilterSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const label =
    value === "all"
      ? "Certificación Gluten"
      : CERT_OPTIONS.find(([k]) => k === value)?.[1] ?? "Certificación Gluten";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[200px]"}>
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        {CERT_OPTIONS.map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RatingFilterSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const label =
    value === "all"
      ? "Calificación"
      : `${value} estrella${value !== "1" ? "s" : ""}`;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[180px]"}>
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n} estrella{n !== 1 ? "s" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Más evaluados" },
  { value: "rating", label: "Mejor puntuación" },
  { value: "name", label: "Nombre A-Z" },
  { value: "reviews", label: "Cant. evaluaciones" },
];

export function SortFilterSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const resolved = !value || value === "default" ? "default" : value;
  const label =
    resolved === "default"
      ? "Ordenar por"
      : SORT_OPTIONS.find((o) => o.value === resolved)?.label ?? "Ordenar por";

  return (
    <Select value={resolved} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[180px]"}>
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
