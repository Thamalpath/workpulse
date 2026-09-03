import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/reports"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[#4263A3] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
            New weekly report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summarize what you accomplished this week.
          </p>
        </div>
      </div>

      <form className="space-y-5 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="title">Report title</Label>
          <Input
            id="title"
            type="text"
            placeholder="e.g. Week of Sep 1 — Mobile App Redesign"
            className="h-11"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              type="text"
              placeholder="Select a project"
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Hours worked</Label>
            <Input
              id="hours"
              type="number"
              placeholder="40"
              className="h-11"
              min={0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Weekly summary</Label>
          <Textarea
            id="summary"
            placeholder="Describe the key accomplishments, milestones, and deliverables completed this week…"
            className="min-h-28"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blockers">Blockers or roadblocks</Label>
          <Textarea
            id="blockers"
            placeholder="Anything blocking progress that needs attention…"
            className="min-h-20"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" asChild>
            <Link href="/reports">Save draft</Link>
          </Button>
          <Button
            type="submit"
            className="bg-[#4263A3] text-white hover:bg-[#344F85]"
          >
            Submit report
            <Send />
          </Button>
        </div>
      </form>
    </div>
  );
}
