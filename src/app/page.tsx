import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitBranch, LockKeyhole, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <Image
          src="/brand/genealogy-hero.png"
          alt="Archivarbeitsplatz mit historischen Fotos und digitalem Stammbaum"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/82 to-background/18" />
        <div className="container relative z-10 py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5">
              Multi-Tenant Stammbaum-App
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-normal sm:text-6xl">
              Ahnenforschung
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Erstelle, verwalte und visualisiere Stammbäume sicher im Team: mit Rollen, Audit-Logs,
              Quellenverwaltung, Drag&Drop-Editor und klarer Tenant-Isolation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="default">
                <Link href="/login">
                  Anmelden <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard öffnen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-card/40 py-10">
        <div className="container grid gap-4 md:grid-cols-3">
          {[
            {
              icon: GitBranch,
              title: "Visueller Editor",
              text: "React Flow, Mini-Map, Kontextmenüs, Auto-Save, Undo/Redo und gespeicherte Positionen."
            },
            {
              icon: UsersRound,
              title: "Zusammenarbeit",
              text: "Tenants, Mitgliedschaften, Einladungen und Rollen von Viewer bis Owner."
            },
            {
              icon: LockKeyhole,
              title: "Security by Default",
              text: "Zod-Validierung, Rate-Limits, Prisma, Upload-Prüfung und Audit-Logs für wichtige Aktionen."
            }
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-5">
              <feature.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-base font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
