import { Badge } from "@/components/ui/badge";
import { FamilyTreeEditor } from "@/components/editor/family-tree-editor";
import { TreeInsights } from "@/components/editor/tree-insights";
import { requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import type { PersonDto, RelationshipDto } from "@/types/family-tree";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export default async function FamilyTreeEditorPage({ params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  const params = await paramsPromise;
  const { tree, membership } = await requireFamilyTreeAccess(params.tenantId, params.treeId);
  const [people, relationships] = await Promise.all([
    prisma.personNode.findMany({
      where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    }),
    prisma.relationship.findMany({
      where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null },
      orderBy: { updatedAt: "desc" }
    })
  ]);
  const serializedPeople = serialize(people) as PersonDto[];
  const serializedRelationships = serialize(relationships) as RelationshipDto[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold">{tree.name}</h1>
            <Badge variant="outline">{membership.role}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">{tree.description || "Visueller Stammbaum-Editor"}</p>
        </div>
      </div>
      <TreeInsights people={serializedPeople} relationships={serializedRelationships} />
      <FamilyTreeEditor
        tenantId={params.tenantId}
        treeId={params.treeId}
        treeName={tree.name}
        role={membership.role}
        people={serializedPeople}
        relationships={serializedRelationships}
      />
    </div>
  );
}
