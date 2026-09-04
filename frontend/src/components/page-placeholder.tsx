import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E1E6ED] bg-white/50 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#4263A3]/10">
          <Icon className="size-7 text-[#4263A3]" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[#18202F]">
          This section is under construction
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          We&apos;re building this feature. It&apos;ll be available soon.
        </p>
      </div>
    </div>
  );
}
