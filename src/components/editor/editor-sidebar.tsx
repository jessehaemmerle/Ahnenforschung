"use client";

import { GitPullRequest, Plus, Search, Wand2 } from "lucide-react";
import type { RelationshipType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { relationshipLabels, relationshipTypes } from "./relationship-style";

export function EditorSidebar({
  canEdit,
  query,
  tagFilter,
  relationshipType,
  onQueryChange,
  onTagFilterChange,
  onRelationshipTypeChange,
  onAddPerson,
  onAutoLayout
}: {
  canEdit: boolean;
  query: string;
  tagFilter: string;
  relationshipType: RelationshipType;
  onQueryChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onRelationshipTypeChange: (value: RelationshipType) => void;
  onAddPerson: () => void;
  onAutoLayout: () => void;
}) {
  return (
    <aside className="w-full shrink-0 border-r bg-card p-3 lg:w-72">
      <div className="space-y-3">
        <Button className="w-full" disabled={!canEdit} onClick={onAddPerson}>
          <Plus className="h-4 w-4" />
          Person hinzufügen
        </Button>
        <Button className="w-full" variant="outline" disabled={!canEdit} onClick={onAutoLayout}>
          <Wand2 className="h-4 w-4" />
          Auto-Layout
        </Button>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Suche
          </Label>
          <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Name, Ort, Beruf" />
        </div>
        <div className="space-y-2">
          <Label>Tag</Label>
          <Input value={tagFilter} onChange={(event) => onTagFilterChange(event.target.value)} placeholder="z. B. Linie A" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            Beziehung
          </Label>
          <Select value={relationshipType} onChange={(event) => onRelationshipTypeChange(event.target.value as RelationshipType)}>
            {relationshipTypes.map((type) => (
              <option key={type} value={type}>
                {relationshipLabels[type]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </aside>
  );
}
