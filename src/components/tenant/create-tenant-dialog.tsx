"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tenants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description")
      })
    });
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Tenant konnte nicht erstellt werden.");
      return;
    }

    const body = (await response.json()) as { tenant: { id: string } };
    toast.success("Tenant erstellt.");
    setOpen(false);
    router.push(`/tenants/${body.tenant.id}/trees`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tenant erstellen
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Neuen Tenant erstellen">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Name</Label>
            <Input id="tenant-name" name="name" required minLength={2} placeholder="Familie Schneider" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-description">Beschreibung</Label>
            <Textarea id="tenant-description" name="description" placeholder="Private Arbeitsgruppe für Familienchronik" />
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
