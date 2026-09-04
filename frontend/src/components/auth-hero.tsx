import Image from "next/image";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";

import heroImage from "@/assets/login-hero.jpg";
import logo from "@/assets/Logo.png";

export function AuthHero() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden text-white lg:block">
      <Image
        src={heroImage.src}
        alt=""
        unoptimized
        fill
        priority
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-[#172033]/95 via-[#172033]/50 to-[#172033]/40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]"
      />

      <div className="relative z-10 flex h-full flex-col p-12">
        <div className="flex items-center gap-2.5">
          <Image
            src={logo.src}
            alt="WorkPulse logo"
            unoptimized
            width={160}
            height={40}
            priority
            className="h-12 w-auto object-contain"
          />
          <span className="text-xl font-bold text-white">Workpulse</span>
        </div>

        <div className="flex flex-1 items-center">
          <div className="max-w-lg space-y-7">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight drop-shadow-md xl:text-5xl">
              The pulse of your team&apos;s weekly progress
            </h1>

            <p className="text-base leading-relaxed text-white/85">
              WorkPulse turns scattered weekly updates into clear, actionable
              insights — so nothing slips through the cracks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
