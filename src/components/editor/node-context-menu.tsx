"use client";

import { Button } from "@/components/ui/button";
import type { PersonDto } from "@/types/family-tree";

export type NodeContextMenuState = {
  x: number;
  y: number;
  personId: string;
};

export function NodeContextMenu({
  state,
  people,
  canEdit,
  onClose,
  onEdit,
  onAddRelative,
  onDuplicate,
  onDelete
}: {
  state: NodeContextMenuState;
  people: PersonDto[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: (personId: string) => void;
  onAddRelative: (person: PersonDto, relation: "parent" | "partner" | "child") => void;
  onDuplicate: (person: PersonDto) => void;
  onDelete: (personId: string) => void;
}) {
  const person = people.find((entry) => entry.id === state.personId);
  const actions: Array<[string, boolean, () => unknown]> = [
    ["Bearbeiten", true, () => onEdit(state.personId)],
    ...(person
      ? [
          ["Partner hinzufügen", canEdit, () => onAddRelative(person, "partner")] as [string, boolean, () => unknown],
          ["Kind hinzufügen", canEdit, () => onAddRelative(person, "child")] as [string, boolean, () => unknown],
          ["Eltern hinzufügen", canEdit, () => onAddRelative(person, "parent")] as [string, boolean, () => unknown],
          ["Duplizieren", canEdit, () => onDuplicate(person)] as [string, boolean, () => unknown]
        ]
      : []),
    ["Löschen", canEdit, () => onDelete(state.personId)]
  ];

  return (
    <div className="fixed z-40 w-56 rounded-lg border bg-popover p-1 shadow-soft" style={{ left: state.x, top: state.y }}>
      {actions.map(([label, enabled, action]) => (
        <Button
          key={label}
          variant="ghost"
          className="w-full justify-start"
          disabled={!enabled}
          onClick={() => {
            onClose();
            void action();
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
