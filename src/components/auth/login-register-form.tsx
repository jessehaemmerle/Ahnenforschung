"use client";

import { FormEvent, useState } from "react";
import { LogIn, Loader2, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";

type RegisterResponse = {
  message?: string;
  issues?: {
    fieldErrors?: Record<string, string[]>;
  };
};

export function LoginRegisterForm({
  callbackUrl,
  inviteToken
}: {
  callbackUrl: string;
  inviteToken?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function acceptInvitation() {
    if (!inviteToken) return false;

    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: inviteToken })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Die Einladung konnte nicht angenommen werden.");
      return true;
    }

    const body = (await response.json()) as { tenantId: string };
    router.push(`/tenants/${body.tenantId}/trees`);
    router.refresh();
    return true;
  }

  async function finishAuthenticatedFlow() {
    if (await acceptInvitation()) return;
    router.push(callbackUrl);
    router.refresh();
  }

  async function submitLogin() {
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    if (!response?.ok) {
      setMessage("E-Mail oder Passwort ist falsch.");
      return;
    }

    await finishAuthenticatedFlow();
  }

  async function submitRegistration() {
    if (password !== passwordConfirmation) {
      setMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as RegisterResponse | null;
      const firstFieldError = Object.values(body?.issues?.fieldErrors ?? {})[0]?.[0];
      setMessage(firstFieldError ?? body?.message ?? "Registrierung fehlgeschlagen.");
      return;
    }

    await submitLogin();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await submitLogin();
      } else {
        await submitRegistration();
      }
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-md border bg-muted p-1">
        <Button
          type="button"
          variant={isLogin ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setMode("login");
            setMessage(null);
          }}
        >
          <LogIn className="h-4 w-4" />
          Anmelden
        </Button>
        <Button
          type="button"
          variant={!isLogin ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setMode("register");
            setMessage(null);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Registrieren
        </Button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {!isLogin ? (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required={!isLogin}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {!isLogin ? (
          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">Passwort wiederholen</Label>
            <Input
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required={!isLogin}
            />
          </div>
        ) : null}

        {message ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLogin ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isLogin ? "Anmelden" : "Konto erstellen"}
        </Button>
      </form>
    </div>
  );
}
