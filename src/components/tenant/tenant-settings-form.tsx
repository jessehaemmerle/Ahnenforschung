"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TenantSettingsForm({
  tenant
}: {
  tenant: {
    id: string;
    name: string;
    description: string | null;
  };
}) {
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description")
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Einstellungen konnten nicht gespeichert werden.");
      return;
    }
    toast.success("Einstellungen gespeichert.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="tenant-name">Name</Label>
        <Input id="tenant-name" name="name" defaultValue={tenant.name} required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-description">Beschreibung</Label>
        <Textarea id="tenant-description" name="description" defaultValue={tenant.description ?? ""} />
      </div>
      <Button>Speichern</Button>
    </form>
  );
}
