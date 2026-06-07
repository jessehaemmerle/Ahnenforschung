import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions, authProviderState } from "@/server/auth/options";
import { InvitationAccepter } from "@/components/tenant/invitation-accepter";

export default async function LoginPage({ searchParams }: { searchParams: { invite?: string } }) {
  const session = await getServerSession(authOptions);
  if (session && !searchParams.invite) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-sm font-semibold text-primary">
            Ahnenforschung
          </Link>
          <CardTitle className="text-2xl">Anmelden oder registrieren</CardTitle>
          <CardDescription>
            Beim ersten Login wird automatisch ein eigener Tenant mit Owner-Rechten erstellt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.invite ? <InvitationAccepter token={searchParams.invite} /> : null}
          <Button asChild className="w-full">
            <Link href="/api/auth/signin/google?callbackUrl=/dashboard" prefetch={false}>
              <ShieldCheck className="h-4 w-4" />
              Mit Google anmelden
            </Link>
          </Button>
          {authProviderState.hasEmail ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/signin/email?callbackUrl=/dashboard" prefetch={false}>
                <Mail className="h-4 w-4" />
                Magic Link per E-Mail
              </Link>
            </Button>
          ) : null}
          {!authProviderState.hasGoogle ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
              Google OAuth ist noch nicht konfiguriert. Setze `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET`.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
