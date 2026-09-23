"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { sanityImageUrl } from "@/lib/product-image";
import styles from "./product-image-fallback.module.scss";

type Variant = "card" | "gallery" | "thumb";

export function ProductImageFallback({
  variant = "card",
  label = "Немає фото",
}: {
  variant?: Variant;
  label?: string;
}) {
  return (
    <div
      className={`${styles.root} ${styles[variant]}`}
      role="img"
      aria-label={label}
    >
      <span className={styles.mark} aria-hidden="true">
        LUXIMPORT
      </span>
    </div>
  );
}

export function SafeFillImage({
  source,
  src: srcProp,
  alt,
  sizes,
  className,
  priority,
  variant = "card",
}: {
  source?: unknown;
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  variant?: Variant;
}) {
  const resolved =
    srcProp?.trim() || sanityImageUrl(source, { width: 900, height: 900 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <ProductImageFallback variant={variant} label={alt || "Немає фото"} />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
