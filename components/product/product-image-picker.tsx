"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImagePickerProps = {
  label: string;
  required?: boolean;
  disabled?: boolean;
  imageName?: string | null;
  hint?: string;
  className?: string;
  onSelect: (file: File | null) => void;
};

export function ProductImagePicker({
  label,
  required = false,
  disabled = false,
  imageName,
  hint,
  className,
  onSelect,
}: ProductImagePickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onSelect(file);
    e.target.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Tomar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
          Elegir del carrete
        </Button>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={handleChange}
      />
      {hint && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {imageName && (
        <p className="text-xs font-medium text-[var(--color-brown)]">✓ {imageName}</p>
      )}
    </div>
  );
}
