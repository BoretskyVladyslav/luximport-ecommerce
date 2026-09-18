import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Акаунт",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname") ?? "";
  const isPublicAuth =
    pathname === "/account/login" || pathname === "/account/register";
  if (isPublicAuth) {
    return children;
  }
  const session = await auth();
  if (!session?.user?.id?.trim()) {
    redirect("/login");
  }
  return children;
}
