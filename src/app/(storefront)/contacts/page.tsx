import { JsonLd } from "@/components/seo/json-ld";
import {
  InstagramIcon,
  FacebookIcon,
  ViberIcon,
  TiktokIcon,
} from "@/components/ui/social-icons";
import { localBusinessJsonLd, pageMetadata } from "@/lib/seo";
import { ContactForm } from "./ContactForm";
import styles from "./page.module.scss";

export const metadata = pageMetadata({
  title: "Контакти",
  description:
    "Зв’яжіться з LuxImport: телефон, email, склад у Львові. Пн–Пт 9:00–18:00.",
  path: "/contacts",
});

export default function ContactsPage() {
  return (
    <div className={styles.container}>
      <JsonLd data={localBusinessJsonLd()} />

      <div className={styles.header}>
        <h1 className={styles.title}>КОНТАКТИ</h1>
        <p className={styles.meta}>ЗВ&#39;ЯЗОК З НАМИ</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.infoPanel}>
          <div className={styles.infoBlock}>
            <div className={styles.label}>Телефон</div>
            <div className={styles.value}>
              <a href="tel:+380964652707" className={styles.valueLink}>
                +38 (096) 465-27-07
              </a>
            </div>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.label}>Email</div>
            <div className={styles.value}>
              <a
                href="mailto:oljacenuk88@gmail.com"
                className={styles.valueLink}
              >
                oljacenuk88@gmail.com
              </a>
            </div>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.label}>Адреса</div>
            <div className={styles.value}>м. Львів (офіс / склад)</div>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.label}>Графік роботи</div>
            <div className={styles.value}>
              Пн–Пт: 9:00 – 18:00
              <br />
              Сб–Нд: Вихідний
            </div>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.label}>Соцмережі</div>
            <div className={styles.socialRow}>
              <a
                href="https://www.instagram.com/lux_import_ua?igsh=OXlrZWpmaXVzZG95"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/share/14RHhHNs66Y/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://invite.viber.com/?g2=AQAIa9r%2FFoLyx1MKtQoVzLSKE3Wfg38mY1N%2FIO4RtY6JHK2rBjNpkkGrkvQZK9mA"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Viber"
              >
                <ViberIcon />
              </a>
              <a
                href="https://www.tiktok.com/@lux_import_ua"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="TikTok"
              >
                <TiktokIcon />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.formPanel}>
          <ContactForm />
        </div>
      </div>

      <div className={styles.mapPlaceholder}>
        <iframe
          title="LuxImport на карті — Львівська область, Сокільники"
          src="https://maps.google.com/maps?q=Львівська+область,+Сокільники+вул.+Львівська+бічна,+6&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="400"
          style={{ border: 0, borderRadius: "12px" }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
