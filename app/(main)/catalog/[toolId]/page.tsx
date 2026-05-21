import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Calendar, Wallet, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TOOL_CATEGORY, TOOL_STATUS } from "@/lib/labels";
import { formatShekel } from "@/lib/utils";
import { ToolGallery } from "./ToolGallery";
import { ShareToolButton } from "./ShareToolButton";
import { WaitlistButton } from "./WaitlistButton";
import { ToolCalendar } from "./ToolCalendar";

export const dynamic = "force-dynamic";

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

  const [waitlistRow, totalAhead] = await Promise.all([
    userId
      ? prisma.waitlist.findUnique({
          where: { toolId_userId: { toolId: tool.id, userId } },
          select: { position: true },
        })
      : Promise.resolve(null),
    prisma.waitlist.count({ where: { toolId: tool.id } }),
  ]);

  const available = tool.status === "AVAILABLE";
  const role = session?.user?.role;
  const status = session?.user?.status;
  const banned = session?.user?.isBanned === true;
  const canRequestLoan =
    !!session?.user && status === "APPROVED" && !banned && available;

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
      </header>

      {tool.description && (
        <p className="text-sm leading-relaxed text-text">{tool.description}</p>
      )}

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
        <Stat icon={Calendar} label="תעריף יומי" value={tool.dailyRate > 0 ? formatShekel(tool.dailyRate) : "חינם"} />
        <Stat icon={Clock} label="עד" value={`${tool.maxDays} ימים`} />
      </section>

      {/* Availability calendar */}
      <section>
        <h2 className="font-bold mb-2">זמינות</h2>
        <ToolCalendar toolId={tool.id} maxDays={tool.maxDays} />
      </section>

      {/* Action area */}
      <section className="flex flex-col gap-3">
        {!session?.user ? (
          <Alert variant="info">
            יש להתחבר כדי לבקש השאלה.
            <Link
              href={`/login?callbackUrl=/catalog/${tool.id}`}
              className="block mt-1 text-primary font-medium underline"
            >
              כניסה / הרשמה
            </Link>
          </Alert>
        ) : status === "PENDING" ? (
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
        ) : role === "GEMACH_MANAGER" || role === "ADMIN" ? null : null}

        {canRequestLoan ? (
          <Link href={`/loans/new?toolId=${tool.id}`}>
            <Button size="lg" variant="primary">
              בקש השאלה
            </Button>
          </Link>
        ) : !available && session?.user && status === "APPROVED" && !banned ? (
          <WaitlistButton
            toolId={tool.id}
            joined={!!waitlistRow}
            position={waitlistRow?.position ?? null}
            totalAhead={totalAhead}
          />
        ) : null}

        <ShareToolButton
          toolName={tool.name}
          gemachName={tool.gemach.name}
          dailyRate={tool.dailyRate}
        />
      </section>
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
