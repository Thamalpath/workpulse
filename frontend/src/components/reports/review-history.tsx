import { CheckCircle, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ReportReview } from "@/services/report.service";
import { formatDateTime } from "@/lib/date";

export function ReviewHistory({ reviews }: { reviews: ReportReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet for this report.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const isCorrection = review.action === "request_correction";
        return (
          <div key={review.id} className="rounded-lg border border-[#E1E6ED] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              {isCorrection ? (
                <Badge className="border-yellow-500 bg-yellow-50 text-yellow-700">
                  <RotateCcw className="size-3" />
                  Changes requested
                </Badge>
              ) : (
                <Badge className="border-green-600 bg-green-50 text-green-700">
                  <CheckCircle className="size-3" />
                  Approved
                </Badge>
              )}
              <span className="text-sm font-medium text-[#18202F]">
                {review.reviewerName || "Reviewer"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(review.createdAt)}
              </span>
              <span className="text-xs text-muted-foreground">
                on version {review.versionNumber}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#18202F]">
                {review.comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}