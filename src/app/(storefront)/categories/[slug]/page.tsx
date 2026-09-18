import { notFound, permanentRedirect } from "next/navigation";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = typeof params.slug === "string" ? params.slug.trim() : "";
  if (!slug) notFound();
  permanentRedirect(`/catalog?category=${encodeURIComponent(slug)}`);
}
