import { Playfair_Display, Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StorefrontDrawers } from "@/components/layout/storefront-drawers";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import styles from "./layout.module.scss";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  display: "swap",
  preload: false,
});
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        styles.root,
        playfair.variable,
        inter.variable,
        "flex min-h-full flex-col antialiased font-body lining-nums tabular-nums flex-1",
      )}
      suppressHydrationWarning
    >
      <Header />
      <StorefrontDrawers />
      <JsonLd data={organizationJsonLd()} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
