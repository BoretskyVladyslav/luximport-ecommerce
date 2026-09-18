"use client";

import { useState } from "react";
import Image from "next/image";
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
  const current = images[active] ?? images[0];

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {current ? (
          <Image
            src={current}
            alt={title}
            fill
            className={`${styles.stageImage} ${isOutOfStock ? styles.stageImageSold : ""}`}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className={styles.placeholder}>Немає фото</div>
        )}
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
              <Image
                src={src}
                alt=""
                fill
                className={styles.thumbImage}
                sizes="68px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
