"use client";

import { useState } from "react";
import { CheckCircle, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewAction } from "@/services/report.service";
import { cn } from "@/lib/utils";

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (action: ReviewAction, comment: string) => Promise<void>;
  defaultAction?: ReviewAction;
};

export function ReviewDialog({
  open,
  onOpenChange,
  onReview,
  defaultAction = "request_correction",
}: ReviewDialogProps) {
  const [action, setAction] = useState<ReviewAction>(defaultAction);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    if (action === "request_correction" && comment.trim() === "") {
      setError("Please describe what needs to change before requesting corrections.");
      return;
    }
    setSubmitting(true);
    try {
      await onReview(action, comment.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit the review.");
      setSubmitting(false);
    }
  }

  const modeButton = (mode: ReviewAction, label: string, icon: React.ReactNode) => {
    const active = action === mode;
    return (
      <button
        type="button"
        onClick={() => setAction(mode)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? mode === "approved"
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-yellow-500 bg-yellow-50 text-yellow-700"
            : "border-[#E1E6ED] bg-white text-muted-foreground hover:bg-[#F5F7FA]",
        )}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review weekly report</DialogTitle>
          <DialogDescription>
            Choose how to respond to this submitted report. The team member is notified
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {modeButton("approved", "Approve", <CheckCircle className="size-4" />)}
          {modeButton("request_correction", "Request changes", <RotateCcw className="size-4" />)}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="text-xs font-medium text-muted-foreground">
            {action === "request_correction"
              ? "Comment describing what needs to change (required)"
              : "Comment (optional)"}
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              action === "request_correction"
                ? "e.g. Please add the missing deliverable links and update the hours breakdown."
                : "Optional note for the team member."
            }
            className="min-h-24"
          />
        </div>

        {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            className={
              action === "approved"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-[#4263A3] text-white hover:bg-[#344F85]"
            }
            onClick={handleConfirm}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {action === "approved" ? "Approve report" : "Request changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}