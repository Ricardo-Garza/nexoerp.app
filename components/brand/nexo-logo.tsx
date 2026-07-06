"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface NexoLogoProps {
  compact?: boolean;
  className?: string;
  textClassName?: string;
  showText?: boolean;
  label?: string;
}

export function NexoLogo({
  compact = false,
  className,
  textClassName,
  showText = true,
  label = "Nexo ERP",
}: NexoLogoProps) {
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950/40",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        <Image
          src="/Logo Nexo ERP.svg"
          alt="Nexo ERP"
          fill
          sizes={compact ? "36px" : "44px"}
          className="object-contain p-1"
        />
      </div>
      {showText && (
        <div className={cn("min-w-0", textClassName)}>
          <p className="truncate font-bold leading-none">{label}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Enterprise Resource Planning
          </p>
        </div>
      )}
    </div>
  );
}
