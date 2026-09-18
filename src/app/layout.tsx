import "@/styles/globals.scss";
import type { Metadata } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { getMetadataBase } from "@/lib/site-url";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "uk_UA",
    type: "website",
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  return (
    <html lang="uk" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
