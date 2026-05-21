"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      variant="primary"
      size="md"
      className="w-auto self-center print:hidden"
    >
      <Printer className="w-4 h-4" />
      הדפס
    </Button>
  );
}
