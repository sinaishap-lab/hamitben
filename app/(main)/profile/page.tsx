import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { USER_ROLE, USER_STATUS } from "@/lib/labels";
import { ProfileEditForm } from "./ProfileEditForm";
import { ReferralCard } from "./ReferralCard";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { BannedAlert } from "./BannedAlert";
import { EnablePushButton } from "@/components/pwa/EnablePushButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/profile");

  const statusVariant =
    user.status === "APPROVED"
      ? "success"
      : user.status === "PENDING"
        ? "warning"
        : "error";

  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">פרופיל</h1>
        <div className="flex gap-2">
          <Badge variant="primary">{USER_ROLE[user.role]}</Badge>
          <Badge variant={statusVariant}>{USER_STATUS[user.status]}</Badge>
        </div>
      </header>

      {user.isBanned && (
        <BannedAlert reason={user.banReason} />
      )}

      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4">
        <h2 className="font-bold mb-3">פרטים אישיים</h2>
        <ProfileEditForm
          userId={user.id}
          initial={{ name: user.name, email: user.email }}
          phone={user.phone}
        />
      </section>

      <ReferralCard
        code={user.referralCode}
        discountTokens={user.discountTokens}
      />

      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-3">
        <h2 className="font-bold">התראות</h2>
        <EnablePushButton />
      </section>

      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-3">
        <h2 className="font-bold">פעולות</h2>
        <Link href="/my-loans" className="text-primary text-sm underline">
          ההשאלות שלי
        </Link>
        <Link href="/invite" className="text-primary text-sm underline">
          הזמן חבר וקבל הנחה
        </Link>
        <Link href="/terms" className="text-primary text-sm underline">
          תנאי השימוש
        </Link>
      </section>

      <section className="bg-bg-surface rounded-2xl border border-red-100 p-4">
        <h2 className="font-bold text-error mb-1">אזור מסוכן</h2>
        <p className="text-xs text-text-muted mb-3">
          מחיקת החשבון היא פעולה בלתי הפיכה. היסטוריית ההשאלות תישמר בצורה אנונימית לצרכי הגמח.
        </p>
        <DeleteAccountButton userId={user.id} />
      </section>
    </div>
  );
}
