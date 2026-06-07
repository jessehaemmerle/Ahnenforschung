"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function InvitationAccepter({ token }: { token: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const accept = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    });
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Einladung konnte nicht angenommen werden.");
      return;
    }

    const body = (await response.json()) as { tenantId: string };
    toast.success("Einladung angenommen.");
    router.push(`/tenants/${body.tenantId}/trees`);
  }, [router, token]);

  useEffect(() => {
    // Accepting an invite is a deliberate external synchronization after auth state changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === "authenticated") void accept();
  }, [accept, status]);

  if (status !== "authenticated") {
    return (
      <div className="rounded-md border bg-secondary p-3 text-sm text-secondary-foreground">
        Melde dich mit der E-Mail-Adresse der Einladung an. Danach wird die Einladung automatisch eingelöst.
      </div>
    );
  }

  return (
    <Button className="w-full" disabled={loading} onClick={accept}>
      {loading ? "Einladung wird angenommen..." : "Einladung annehmen"}
    </Button>
  );
}
