import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { LoginRegisterForm } from "@/components/auth/login-register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/server/auth/options";
import { InvitationAccepter } from "@/components/tenant/invitation-accepter";

function safeCallbackUrl(callbackUrl?: string) {
  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) return callbackUrl;
  return "/dashboard";
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: { callbackUrl?: string; invite?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session && !searchParams.invite) redirect("/dashboard");
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-sm font-semibold text-primary">
            Ahnenforschung
          </Link>
          <CardTitle className="text-2xl">Anmelden oder registrieren</CardTitle>
          <CardDescription>Nutze dein Konto mit E-Mail-Adresse und Passwort.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.invite && session ? <InvitationAccepter token={searchParams.invite} /> : null}
          {!session ? <LoginRegisterForm callbackUrl={callbackUrl} inviteToken={searchParams.invite} /> : null}
        </CardContent>
      </Card>
    </main>
  );
}
