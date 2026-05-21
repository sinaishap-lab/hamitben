import { Alert } from "@/components/ui/Alert";

export function BannedAlert({ reason }: { reason: string | null }) {
  return (
    <Alert variant="error">
      <strong className="font-bold">חשבונך חסום מהשאלות.</strong>
      <p className="mt-1 text-sm">
        {reason || "החזרת כלי באיחור."} ניתן לפנות למנהל ראשי להסרת החסימה.
      </p>
    </Alert>
  );
}
