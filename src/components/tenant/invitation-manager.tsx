"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export function InvitationManager({ tenantId, invitations }: { tenantId: string; invitations: Invitation[] }) {
  const router = useRouter();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        role: form.get("role")
      })
    });
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Einladung konnte nicht erstellt werden.");
      return;
    }
    const body = (await response.json()) as { inviteUrl: string; mail: { sent: boolean } };
    setInviteUrl(body.inviteUrl);
    toast.success(body.mail.sent ? "Einladung versendet." : "Einladung erstellt.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="invite-email">E-Mail</Label>
          <Input id="invite-email" name="email" type="email" required placeholder="person@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Rolle</Label>
          <Select id="invite-role" name="role" defaultValue="VIEWER">
            {["VIEWER", "EDITOR", "ADMIN"].map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </div>
        <Button disabled={loading} className="w-full">
          <Send className="h-4 w-4" />
          {loading ? "Wird erstellt..." : "Einladen"}
        </Button>
        {inviteUrl ? <p className="break-all rounded-md bg-muted p-3 text-xs">{inviteUrl}</p> : null}
      </form>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
              <p className="font-semibold">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">{invitation.role}</p>
            </div>
            <Badge variant={invitation.status === "PENDING" ? "warning" : "secondary"}>{invitation.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
