import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewGemachForm } from "./NewGemachForm";

export const dynamic = "force-dynamic";

export default async function AdminNewGemachPage({
  searchParams,
}: {
  searchParams: { managerPhone?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  // When linked from the user edit page ("פתח גמח חדש למשתמש זה") the
  // manager's phone is pre-filled so the admin doesn't have to retype it.
  const prefilledManagerPhone = searchParams.managerPhone ?? "";

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">גמח חדש</h1>
        <p className="text-sm text-text-muted mt-1">
          המנהל חייב להיות משתמש קיים ומאושר. הוא יקודם אוטומטית לתפקיד &quot;מנהל גמח&quot;.
        </p>
      </header>
      <NewGemachForm prefilledManagerPhone={prefilledManagerPhone} />
    </div>
  );
}
