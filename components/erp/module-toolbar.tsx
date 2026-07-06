"use client";

import type { ReactNode } from "react";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ModuleToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
  hidden?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  group?: "primary" | "more";
}

interface ModuleToolbarProps {
  title?: string;
  subtitle?: string;
  actions: ModuleToolbarAction[];
  onRefresh?: () => void;
  className?: string;
}

export function ModuleToolbar({
  title,
  subtitle,
  actions,
  onRefresh,
  className,
}: ModuleToolbarProps) {
  const visible = actions.filter((action) => !action.hidden);
  const primary = visible
    .filter((action) => action.group !== "more")
    .slice(0, 5);
  const more = visible.filter(
    (action) => action.group === "more" || !primary.includes(action),
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/80 px-3 py-2 shadow-sm",
          className,
        )}
        data-testid="module-toolbar"
      >
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && <p className="truncate text-sm font-semibold">{title}</p>}
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onRefresh && (
            <ToolbarButton
              action={{
                id: "refresh",
                label: "Refrescar",
                icon: <RefreshCw className="h-4 w-4" />,
                onClick: onRefresh,
                variant: "outline",
              }}
            />
          )}
          {primary.map((action) => (
            <ToolbarButton key={action.id} action={action} />
          ))}
          {more.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="mr-1 h-4 w-4" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Acciones adicionales</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {more.map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    disabled={action.disabled || !action.onClick}
                    onClick={action.onClick}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                    {action.disabled && action.disabledReason && (
                      <span className="ml-auto max-w-28 truncate text-[10px] text-muted-foreground">
                        {action.disabledReason}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({ action }: { action: ModuleToolbarAction }) {
  const button = (
    <Button
      size="sm"
      variant={action.variant ?? "outline"}
      disabled={action.disabled || !action.onClick}
      onClick={action.onClick}
      data-testid={`toolbar-${action.id}`}
      className="gap-1.5"
    >
      {action.icon}
      {action.label}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{button}</span>
      </TooltipTrigger>
      <TooltipContent>
        {action.disabled
          ? (action.disabledReason ?? "No disponible en este contexto")
          : action.label}
      </TooltipContent>
    </Tooltip>
  );
}
