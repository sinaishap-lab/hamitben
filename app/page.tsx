import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Beta feedback (2026-05): the catalog is the entry point. Visitors should
// see the tools immediately, with no signup wall between them and browsing.
// Registration is prompted only when a guest tries to actually borrow a tool
// (see GuestAvailability on the tool detail page).
export default async function HomePage() {
  const session = await auth();
  redirect(session?.user?.role === "ADMIN" ? "/admin" : "/catalog");
}
