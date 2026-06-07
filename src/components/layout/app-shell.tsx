"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, GitBranch, LayoutDashboard, MailPlus, Settings, ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

type Membership = {
  id: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
};

function isAdminRole(role: string) {
  return role === "ADMIN" || role === "OWNER";
}

export function AppShell({
  user,
  memberships,
  children
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  memberships: Membership[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const primaryTenant = memberships[0]?.tenant;
  const adminMemberships = memberships.filter((membership) => isAdminRole(membership.role));
  const primaryAdminTenant = adminMemberships[0]?.tenant;
  const isAdminRoute = pathname.startsWith("/admin");
  const customerNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tenants", href: "/tenants", icon: BookOpen },
    ...(primaryTenant
      ? [
          { label: "Stammbäume", href: `/tenants/${primaryTenant.id}/trees`, icon: GitBranch },
          { label: "Quellen", href: `/tenants/${primaryTenant.id}/sources`, icon: FileText }
        ]
      : [])
  ];
  const adminNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(primaryAdminTenant
      ? [
          { label: "Mitglieder", href: `/admin/tenants/${primaryAdminTenant.id}/members`, icon: UsersRound },
          { label: "Einladungen", href: `/admin/tenants/${primaryAdminTenant.id}/invitations`, icon: MailPlus },
          { label: "Audit", href: `/admin/tenants/${primaryAdminTenant.id}/audit-log`, icon: ShieldCheck },
          { label: "Einstellungen", href: `/admin/tenants/${primaryAdminTenant.id}/settings`, icon: Settings },
          { label: "Kundenansicht", href: `/tenants/${primaryAdminTenant.id}/trees`, icon: GitBranch }
        ]
      : [])
  ];
  const nav = isAdminRoute
    ? adminNav
    : [
        ...customerNav,
        ...(primaryAdminTenant
          ? [{ label: "Adminbereich", href: `/admin/tenants/${primaryAdminTenant.id}/members`, icon: ShieldCheck }]
          : [])
      ];
  const mobileNav = nav.slice(0, !isAdminRoute && primaryAdminTenant ? 5 : 4);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/dashboard" className="font-heading text-xl font-extrabold">
            Ahnenforschung
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isActive(item.href) && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Aktuelle Tenants</p>
          <div className="mt-3 space-y-2">
            {memberships.slice(0, 3).map((membership) => (
              <Link key={membership.id} href={`/tenants/${membership.tenant.id}/trees`} className="block rounded-md border p-3 hover:bg-accent">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{membership.tenant.name}</span>
                  <Badge variant="outline">{membership.role}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <CommandPalette
            tenants={memberships.map((membership) => membership.tenant)}
            adminTenants={adminMemberships.map((membership) => membership.tenant)}
          />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/profile" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials(user.name || user.email)}
              </div>
              <span className="hidden text-sm font-semibold md:inline">{user.name || user.email}</span>
            </Link>
            <SignOutButton />
          </div>
        </header>
        <main className="px-4 pb-20 pt-4 md:px-6 md:pt-6 lg:pb-6">{children}</main>
      </div>
      <nav className={cn("fixed inset-x-0 bottom-0 z-30 grid border-t bg-card lg:hidden", mobileNav.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold text-muted-foreground",
              isActive(item.href) && "text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
