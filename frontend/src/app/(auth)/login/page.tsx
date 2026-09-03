"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { AuthHero } from "@/components/auth-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  if (isLoading) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(identifier, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:grid lg:grid-cols-2">
      <AuthHero />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 lg:hidden"
        >
          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#4263A3]/15 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#38B8C4]/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full max-w-sm flex-col">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#4263A3] shadow-lg shadow-[#4263A3]/30">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              WorkPulse
            </span>
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your credentials to continue.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-[#C85C5C]/30 bg-[#C85C5C]/10 px-4 py-3 text-sm text-[#C85C5C]"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Username or email</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@workpulse.com"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#4263A3] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button
              className="h-11 w-full bg-[#4263A3] text-white hover:bg-[#344F85]"
              size="lg"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 rounded-lg border border-[#E1E6ED] bg-[#F5F7FA] px-4 py-3 text-center text-xs text-muted-foreground">
            Demo credentials:{" "}
            <span className="font-medium text-[#18202F]">
              admin@workpulse.com
            </span>{" "}
            / <span className="font-medium text-[#18202F]">admin123</span>
          </p>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#4263A3] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
