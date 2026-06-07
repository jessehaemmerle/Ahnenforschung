import type { RelationshipType } from "@prisma/client";

export const relationshipLabels: Record<RelationshipType, string> = {
  MARRIAGE: "Ehe",
  PARTNERSHIP: "Partnerschaft",
  DIVORCED: "Geschieden",
  ENGAGEMENT: "Verlobung",
  PARENT_OF: "Elternteil von",
  SON_OF: "Sohn von",
  DAUGHTER_OF: "Tochter von",
  CHILD_OF: "Kind von",
  ADOPTED_CHILD: "Adoptivkind",
  STEPCHILD: "Stiefkind",
  SIBLING: "Geschwister",
  HALF_SIBLING: "Halbgeschwister",
  GUARDIANSHIP: "Vormundschaft",
  OTHER: "Sonstige Beziehung"
};

export const relationshipColor: Record<RelationshipType, string> = {
  MARRIAGE: "#0f8f8f",
  PARTNERSHIP: "#4f8a4f",
  DIVORCED: "#be4b49",
  ENGAGEMENT: "#bd7b18",
  PARENT_OF: "#2563eb",
  SON_OF: "#3b82f6",
  DAUGHTER_OF: "#db2777",
  CHILD_OF: "#7c3aed",
  ADOPTED_CHILD: "#059669",
  STEPCHILD: "#64748b",
  SIBLING: "#0d9488",
  HALF_SIBLING: "#14b8a6",
  GUARDIANSHIP: "#7f1d1d",
  OTHER: "#475569"
};

export const relationshipTypes = Object.keys(relationshipLabels) as RelationshipType[];
