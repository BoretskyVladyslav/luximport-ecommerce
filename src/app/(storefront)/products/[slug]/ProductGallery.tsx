"use client";

import { useState } from "react";
import { SafeFillImage } from "@/components/ui/product-image-fallback";
import styles from "./page.module.scss";

export function ProductGallery({
  images,
  title,
  isOutOfStock,
}: {
  images: string[];
  title: string;
  isOutOfStock: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0] ?? null;

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        <SafeFillImage
          src={current}
          alt={title}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`${styles.stageImage} ${isOutOfStock ? styles.stageImageSold : ""}`}
          priority
          variant="gallery"
        />
        {isOutOfStock && (
          <div className={styles.soldOverlay}>
            <div className={styles.soldBadge}>Розпродано</div>
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className={styles.thumbs} role="list">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className={`${styles.thumb} ${index === active ? styles.thumbActive : ""}`}
              onClick={() => setActive(index)}
              aria-label={`Фото ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            >
              <SafeFillImage
                src={src}
                alt=""
                sizes="68px"
                className={styles.thumbImage}
                variant="thumb"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
