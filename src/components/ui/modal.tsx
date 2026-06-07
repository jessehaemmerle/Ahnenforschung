"use client";

import { X } from "lucide-react";

import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  children,
  onClose,
  className
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className={cn("max-h-[92vh] w-full max-w-xl overflow-auto rounded-lg border bg-card shadow-soft", className)}>
        <div className="sticky top-0 flex items-center justify-between border-b bg-card px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button aria-label="Schließen" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
