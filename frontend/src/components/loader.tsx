"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { cn } from "@/lib/utils";
import loaderSrc from "@/assets/Loader.lottie";

export function Loader({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <DotLottieReact
      src={loaderSrc}
      autoplay
      loop
      useFrameInterpolation
      style={{ width: size, height: size }}
      className={className}
    />
  );
}

export function FullPageLoader({
  label = "Loading…",
  size = 64,
}: {
  label?: string;
  size?: number;
}) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Loader size={size} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
