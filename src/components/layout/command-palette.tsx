"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type Tenant = {
  id: string;
  name: string;
};

export function CommandPalette({ tenants, adminTenants = [] }: { tenants: Tenant[]; adminTenants?: Tenant[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profil", href: "/profile" },
      { label: "Tenants", href: "/tenants" },
      ...tenants.flatMap((tenant) => [
        { label: `${tenant.name}: Stammbäume`, href: `/tenants/${tenant.id}/trees` },
        { label: `${tenant.name}: Quellen`, href: `/tenants/${tenant.id}/sources` }
      ]),
      ...adminTenants.flatMap((tenant) => [
        { label: `${tenant.name}: Admin Mitglieder`, href: `/admin/tenants/${tenant.id}/members` },
        { label: `${tenant.name}: Admin Einladungen`, href: `/admin/tenants/${tenant.id}/invitations` },
        { label: `${tenant.name}: Admin Audit-Log`, href: `/admin/tenants/${tenant.id}/audit-log` },
        { label: `${tenant.name}: Admin Einstellungen`, href: `/admin/tenants/${tenant.id}/settings` }
      ])
    ],
    [adminTenants, tenants]
  );

  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <>
      <button
        className="hidden h-9 min-w-64 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        Suche oder springe zu...
        <kbd className="ml-auto rounded border px-1.5 text-[10px]">Ctrl K</kbd>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Command Palette">
        <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ziel suchen" />
        <div className="mt-4 space-y-1">
          {filtered.map((command) => (
            <Link
              key={command.href}
              href={command.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {command.label}
            </Link>
          ))}
        </div>
      </Modal>
    </>
  );
}
