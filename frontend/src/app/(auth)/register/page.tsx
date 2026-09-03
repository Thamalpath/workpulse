"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { AuthHero } from "@/components/auth-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, username, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
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
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Get started with WorkPulse in less than a minute.
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
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Cooper"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="jane.cooper"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#4263A3] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
