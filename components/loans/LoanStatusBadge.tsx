import type { LoanStatus } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { LOAN_STATUS } from "@/lib/labels";

const VARIANTS: Record<
  LoanStatus,
  "neutral" | "primary" | "accent" | "success" | "warning" | "error"
> = {
  PENDING: "warning",
  APPROVED: "primary",
  REJECTED: "error",
  ACTIVE: "accent",
  RETURNED: "success",
  OVERDUE: "error",
  CANCELLED: "neutral",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <Badge variant={VARIANTS[status]}>{LOAN_STATUS[status]}</Badge>;
}
