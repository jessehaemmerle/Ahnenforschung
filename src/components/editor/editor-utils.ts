import type { Edge, Node } from "@xyflow/react";

import type { FamilyTreeEditorData, PersonDto, RelationshipDto } from "@/types/family-tree";
import { relationshipColor, relationshipLabels } from "./relationship-style";

export type EditorHistory = {
  people: PersonDto[];
  relationships: RelationshipDto[];
};

export function cloneState(people: PersonDto[], relationships: RelationshipDto[]): EditorHistory {
  return {
    people: structuredClone(people),
    relationships: structuredClone(relationships)
  };
}

export function tagsOf(person: PersonDto) {
  return Array.isArray(person.tags) ? person.tags.map(String) : [];
}

export function personToNode(person: PersonDto): Node<{ person: PersonDto }> {
  return {
    id: person.id,
    type: "person",
    position: { x: person.x, y: person.y },
    data: { person }
  };
}

export function relationshipToEdge(relationship: RelationshipDto): Edge {
  const color = relationshipColor[relationship.type];
  return {
    id: relationship.id,
    source: relationship.sourcePersonId,
    target: relationship.targetPersonId,
    label: relationshipLabels[relationship.type],
    type: "smoothstep",
    animated: relationship.status === "ACTIVE",
    style: { stroke: color, strokeWidth: 2.5 },
    labelStyle: { fill: color, fontWeight: 700 },
    data: { relationship }
  };
}

export function apiUrl(data: FamilyTreeEditorData, path = "") {
  return `/api/tenants/${data.tenantId}/trees/${data.treeId}${path}`;
}

export async function parseError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.message ?? "Aktion fehlgeschlagen.";
}

export function download(filename: string, content: BlobPart, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function canEditRole(role: FamilyTreeEditorData["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "EDITOR";
}
