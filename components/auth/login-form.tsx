"use client";

import { useState } from "react";
import { signUpWithEmail, signInWithEmail } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { safeReturnUrl } from "@/lib/safe-return-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ returnUrl }: { returnUrl: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password, returnUrl);
        if (!result.ok) setError(result.error);
        else setMessage(result.message);
      } else {
        const result = await signInWithEmail(email, password, returnUrl);
        if (result?.ok === false) setError(result.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      if (msg.includes("JSON") || msg.includes("<!DOCTYPE")) {
        setError(
          "No se pudo conectar con Supabase. Revisá las variables de entorno en Vercel y hacé Redeploy después de guardarlas."
        );
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const safeReturn = safeReturnUrl(returnUrl);
      // Mismo origen que la pestaña actual (www vs apex) → la cookie PKCE coincide en el callback
      const redirectTo = `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(safeReturn)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
        return;
      }
      if (!data.url) {
        setError("No se pudo iniciar sesión con Google.");
        setLoading(false);
        return;
      }

      window.location.assign(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading}
      >
        Continuar con Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-[var(--color-muted-foreground)]">
            o
          </span>
        </div>
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--color-destructive)]" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-[var(--color-brown)]" role="status">
            {message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {isSignUp ? "Registrarse" : "Iniciar sesión"}
        </Button>
      </form>

      <button
        type="button"
        className="w-full text-center text-sm font-medium text-[var(--color-accent)] hover:underline"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setMessage(null);
        }}
      >
        {isSignUp
          ? "¿Ya tenés cuenta? Iniciá sesión"
          : "¿No tenés cuenta? Registrate"}
      </button>
    </div>
  );
}
