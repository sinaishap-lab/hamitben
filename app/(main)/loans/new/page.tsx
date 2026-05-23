import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { Wallet, Calendar, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/Alert";
import { formatShekel } from "@/lib/utils";
import { LoanRequestForm } from "./LoanRequestForm";

export const dynamic = "force-dynamic";

export default async function NewLoanPage({
  searchParams,
}: {
  searchParams: { toolId?: string };
}) {
  const session = await auth();
  const toolId = searchParams.toolId;

  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        `/loans/new${toolId ? `?toolId=${toolId}` : ""}`
      )}`
    );
  }

  if (!toolId) {
    redirect("/catalog");
  }

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, isActive: true },
    select: {
      id: true,
      name: true,
      images: true,
      category: { select: { name: true } },
      maxDays: true,
      dailyRate: true,
      depositAmount: true,
      status: true,
      gemach: { select: { name: true } },
    },
  });
  if (!tool) notFound();

  // Gate state
  if (session.user.status !== "APPROVED") {
    return (
      <div className="px-4 py-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary">בקשת השאלה</h1>
        <Alert variant="warning">
          חשבונך עוד לא אושר. השאלה תתאפשר רק לאחר אישור מנהל.
        </Alert>
      </div>
    );
  }
  if (session.user.isBanned) {
    return (
      <div className="px-4 py-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary">בקשת השאלה</h1>
        <Alert variant="error">
          חשבונך חסום מהשאלות עתידיות. ניתן לפנות למנהל.
        </Alert>
      </div>
    );
  }
  // How many referral discount tokens does this user currently have?
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discountTokens: true },
  });
  const discountTokens = currentUser?.discountTokens ?? 0;

  if (tool.status !== "AVAILABLE") {
    return (
      <div className="px-4 py-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary">בקשת השאלה</h1>
        <Alert variant="warning">
          הכלי אינו זמין כעת. ניתן להצטרף לרשימת המתנה מדף הכלי.
        </Alert>
        <Link
          href={`/catalog/${tool.id}`}
          className="text-primary underline text-center"
        >
          חזרה לדף הכלי
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold text-primary">בקשת השאלה</h1>
        <p className="text-sm text-text-muted mt-1">
          3 צעדים: תאריכים → אישור תנאים → נעילת פיקדון
        </p>
      </header>

      {/* Tool summary */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-3 flex gap-3 items-center">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bg shrink-0 border border-primary-50">
          {tool.images[0] ? (
            <Image
              src={tool.images[0]}
              alt={tool.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold truncate">{tool.name}</div>
          <div className="text-xs text-text-muted">
            {tool.category.name} · {tool.gemach.name}
          </div>
          <div className="text-xs mt-1 flex flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" aria-hidden />
              {formatShekel(tool.depositAmount)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden />
              {tool.dailyRate > 0 ? formatShekel(tool.dailyRate) + "/יום" : "חינם"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden />
              עד {tool.maxDays} ימים
            </span>
          </div>
        </div>
      </section>

      <LoanRequestForm
        toolId={tool.id}
        maxDays={tool.maxDays}
        dailyRate={tool.dailyRate}
        depositAmount={tool.depositAmount}
        discountTokens={discountTokens}
      />
    </div>
  );
}
