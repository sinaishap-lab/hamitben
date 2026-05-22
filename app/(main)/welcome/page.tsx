import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WelcomeContent } from "./WelcomeContent";

export const dynamic = "force-dynamic";

// Post-login greeting. Shown once right after sign-in, then the user
// continues into the app. Not a permanent destination.
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dest = session.user.role === "ADMIN" ? "/admin" : "/catalog";

  return (
    <WelcomeContent
      name={session.user.name ?? ""}
      dest={dest}
      role={session.user.role}
    />
  );
}
