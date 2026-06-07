import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { formatDate } from "@/lib/utils";

export default async function PersonDetailPage({
  params: paramsPromise
}: {
  params: Promise<{ tenantId: string; treeId: string; personId: string }>;
}) {
  const params = await paramsPromise;
  await requireFamilyTreeAccess(params.tenantId, params.treeId);
  const person = await prisma.personNode.findFirst({
    where: {
      id: params.personId,
      tenantId: params.tenantId,
      treeId: params.treeId,
      deletedAt: null
    },
    include: {
      sources: { where: { deletedAt: null } },
      mediaFiles: { where: { deletedAt: null } },
      events: { where: { deletedAt: null }, orderBy: { eventDate: "asc" } }
    }
  });
  if (!person) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">
            {person.firstName} {person.lastName}
          </h1>
          <p className="mt-2 text-muted-foreground">{person.profession || "Person im Stammbaum"}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/tenants/${params.tenantId}/trees/${params.treeId}`}>Editor öffnen</Link>
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Biografie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Geboren" value={`${formatDate(person.birthDate)} · ${person.birthPlace ?? "Ort unbekannt"}`} />
              <Info label="Gestorben" value={`${formatDate(person.deathDate)} · ${person.deathPlace ?? "Ort unbekannt"}`} />
              <Info label="Geburtsname" value={person.birthName ?? "Keine Angabe"} />
              <Info label="Herkunft" value={person.originPlace ?? person.address ?? "Keine Angabe"} />
            </div>
            <p className="leading-7 text-muted-foreground">{person.biography || "Keine Notizen vorhanden."}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metadaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">{person.privacy}</Badge>
            <Info label="Quellen" value={person.sources.length} />
            <Info label="Medien" value={person.mediaFiles.length} />
            <Info label="Ereignisse" value={person.events.length} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
