"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { Loader } from "@/components/loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={56} />
          <span className="text-sm font-medium text-muted-foreground">
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
