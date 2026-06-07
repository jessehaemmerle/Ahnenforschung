"use client";

import { Handle, Position } from "@xyflow/react";
import { Calendar, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PersonDto } from "@/types/family-tree";

export function PersonNodeCard({ data, selected }: { data: { person: PersonDto }; selected?: boolean }) {
  const person = data.person;

  return (
    <div className={`w-56 rounded-lg border bg-card p-3 shadow-sm transition ${selected ? "border-primary ring-2 ring-primary/30" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-extrabold text-primary">
          {person.firstName[0]}
          {person.lastName[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">
            {person.firstName} {person.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{person.profession || person.birthName || "Person"}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(person.birthDate)}
        </p>
        {person.birthPlace ? (
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{person.birthPlace}</span>
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Badge variant={person.privacy === "TENANT" ? "secondary" : "warning"}>{person.privacy}</Badge>
      </div>
    </div>
  );
}
