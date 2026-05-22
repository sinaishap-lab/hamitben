import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Calendar, Wallet, Clock, CalendarClock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { TOOL_CATEGORY, TOOL_STATUS } from "@/lib/labels";
import { formatShekel, formatDateHe } from "@/lib/utils";
import { computeNextFree } from "@/lib/availability";
import { ToolGallery } from "./ToolGallery";
import { ShareToolButton } from "./ShareToolButton";
import { WaitlistButton } from "./WaitlistButton";
import { ToolCalendar } from "./ToolCalendar";
import { InlineLoanForm } from "./InlineLoanForm";
import { GuestAvailability } from "./GuestAvailability";
import { ReviewSection } from "./ReviewSection";
import { FavoriteButton } from "@/components/tools/FavoriteButton";

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function ToolPage({
  params,
}: {
  params: { toolId: string };
}) {
  const tool = await prisma.tool.findFirst({
    where: { id: params.toolId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      images: true,
      status: true,
      autoApprove: true,
      depositAmount: true,
      dailyRate: true,
      maxDays: true,
      gemach: {
        select: { id: true, name: true, address: true, phone: true },
      },
    },
  });
  if (!tool) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const today = startOfDay(new Date());

  const [
    waitlistRow,
    totalAhead,
    currentUser,
    favoriteRow,
    reviews,
    completedLoan,
    existingReview,
    busyLoans,
  ] = await Promise.all([
    userId
      ? prisma.waitlist.findUnique({
          where: { toolId_userId: { toolId: tool.id, userId } },
          select: { position: true },
        })
      : Promise.resolve(null),
    prisma.waitlist.count({ where: { toolId: tool.id } }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { discountTokens: true },
        })
      : Promise.resolve(null),
    userId
      ? prisma.favorite.findUnique({
          where: { userId_toolId: { userId, toolId: tool.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.review.findMany({
      where: { toolId: tool.id, type: "TOOL" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    userId
      ? prisma.loan.findFirst({
          where: {
            toolId: tool.id,
            userId,
            status: { in: ["RETURNED", "OVERDUE"] },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    userId
      ? prisma.review.findFirst({
          where: { toolId: tool.id, userId, type: "TOOL" },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.loan.findMany({
      where: {
        toolId: tool.id,
        status: { in: ["APPROVED", "ACTIVE"] },
        endDate: { gte: today },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  const available = tool.status === "AVAILABLE";
  const status = session?.user?.status;
  const banned = session?.user?.isBanned === true;
  const canRequestLoan =
    !!session?.user && status === "APPROVED" && !banned && available;

  const nextFree = computeNextFree(busyLoans, today);
  const isBusy = nextFree.getTime() > today.getTime();

  return (
    <article className="px-4 py-4 flex flex-col gap-5">
      <ToolGallery images={tool.images} name={tool.name} />

      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <Badge
            variant={
              available
                ? "success"
                : tool.status === "LOANED"
                  ? "warning"
                  : "neutral"
            }
          >
            {TOOL_STATUS[tool.status]}
          </Badge>
        </div>
        <Badge variant="primary" className="self-start">
          {TOOL_CATEGORY[tool.category]}
        </Badge>
        {isBusy && (
          <div className="flex items-center gap-1.5 text-sm text-warning font-medium">
            <CalendarClock className="w-4 h-4" aria-hidden />
            הכלי תפוס — מתפנה ב-{formatDateHe(nextFree)}
          </div>
        )}
      </header>

      {tool.description && (
        <p className="text-sm leading-relaxed text-text">{tool.description}</p>
      )}

      {/* Save + share */}
      <section className="flex gap-2">
        {userId && (
          <div className="flex-1">
            <FavoriteButton toolId={tool.id} initialFavorite={!!favoriteRow} />
          </div>
        )}
        <div className="flex-1">
          <ShareToolButton
            toolName={tool.name}
            gemachName={tool.gemach.name}
            dailyRate={tool.dailyRate}
          />
        </div>
      </section>

      {/* Gemach */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-1">
        <div className="font-bold">{tool.gemach.name}</div>
        <div className="text-sm text-text-muted flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" aria-hidden />
          {tool.gemach.address}
        </div>
        {tool.gemach.phone && (
          <a
            href={`tel:${tool.gemach.phone}`}
            className="text-sm text-primary flex items-center gap-1.5"
            dir="ltr"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden />
            {tool.gemach.phone}
          </a>
        )}
      </section>

      {/* Pricing */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 grid grid-cols-3 gap-2 text-center">
        <Stat icon={Wallet} label="פיקדון" value={formatShekel(tool.depositAmount)} />
        <Stat
          icon={Calendar}
          label="תעריף יומי"
          value={tool.dailyRate > 0 ? formatShekel(tool.dailyRate) : "חינם"}
        />
        <Stat icon={Clock} label="עד" value={`${tool.maxDays} ימים`} />
      </section>

      {/* Inline loan flow when eligible, otherwise gate messaging + calendar */}
      {canRequestLoan ? (
        <section>
          <InlineLoanForm
            toolId={tool.id}
            maxDays={tool.maxDays}
            dailyRate={tool.dailyRate}
            depositAmount={tool.depositAmount}
            discountTokens={currentUser?.discountTokens ?? 0}
          />
        </section>
      ) : !session?.user ? (
        <section>
          <GuestAvailability toolId={tool.id} maxDays={tool.maxDays} />
        </section>
      ) : (
        <>
          <section>
            <h2 className="font-bold mb-2">זמינות</h2>
            <ToolCalendar toolId={tool.id} maxDays={tool.maxDays} />
          </section>

          <section className="flex flex-col gap-3">
            {status === "PENDING" ? (
              <Alert variant="warning">
                חשבונך ממתין לאישור מנהל. השאלה תתאפשר לאחר אישור.
              </Alert>
            ) : banned ? (
              <Alert variant="error">
                חשבונך חסום מהשאלות עתידיות.{" "}
                <Link href="/contact" className="underline">
                  צור קשר
                </Link>
              </Alert>
            ) : null}

            {!available && status === "APPROVED" && !banned && (
              <WaitlistButton
                toolId={tool.id}
                joined={!!waitlistRow}
                position={waitlistRow?.position ?? null}
                totalAhead={totalAhead}
              />
            )}
          </section>
        </>
      )}

      {/* Reviews */}
      <ReviewSection
        toolId={tool.id}
        initialReviews={reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
        canReview={!!completedLoan}
        alreadyReviewed={!!existingReview}
      />
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="w-5 h-5 text-primary" aria-hidden />
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
