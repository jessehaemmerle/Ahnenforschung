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

export function CreateTreeDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/tenants/${tenantId}/trees`, {
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
      toast.error(body?.message ?? "Stammbaum konnte nicht erstellt werden.");
      return;
    }

    const body = (await response.json()) as { tree: { id: string } };
    toast.success("Stammbaum erstellt.");
    setOpen(false);
    router.push(`/tenants/${tenantId}/trees/${body.tree.id}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Neuen Stammbaum erstellen
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Neuen Stammbaum erstellen">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tree-name">Name</Label>
            <Input id="tree-name" name="name" required minLength={2} placeholder="Familienchronik 2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tree-description">Beschreibung</Label>
            <Textarea id="tree-description" name="description" placeholder="Mehrgenerationen-Stammbaum mit Quellen" />
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
