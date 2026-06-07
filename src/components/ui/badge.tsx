import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "warning" | "success";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold", variants[variant], className)}
      {...props}
    />
  );
}
