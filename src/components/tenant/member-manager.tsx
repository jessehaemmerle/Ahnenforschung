"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Member = {
  id: string;
  role: string;
  user: { name: string | null; email: string | null };
};

export function MemberManager({ tenantId, members }: { tenantId: string; members: Member[] }) {
  const router = useRouter();

  async function updateRole(id: string, role: string) {
    const response = await fetch(`/api/tenants/${tenantId}/members/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Rolle konnte nicht geändert werden.");
      return;
    }
    toast.success("Rolle aktualisiert.");
    router.refresh();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/tenants/${tenantId}/members/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Mitglied konnte nicht entfernt werden.");
      return;
    }
    toast.success("Mitglied entfernt.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">{member.user.name || member.user.email}</p>
            <p className="text-sm text-muted-foreground">{member.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{member.role}</Badge>
            <Select defaultValue={member.role} onChange={(event) => updateRole(member.id, event.target.value)}>
              {["OWNER", "ADMIN", "EDITOR", "VIEWER"].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => remove(member.id)}>
              Entfernen
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
