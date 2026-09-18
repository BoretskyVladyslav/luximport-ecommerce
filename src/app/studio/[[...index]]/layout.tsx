export const metadata = {
  title: "Sanity Studio",
  description: "Manage Luximport Shop content",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
