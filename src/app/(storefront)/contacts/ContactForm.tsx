"use client";

import { useState } from "react";
import styles from "./page.module.scss";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !message.trim() || !isValidEmail(normalizedEmail))
      return;
    setIsSubmitting(true);
    setSent(false);
    try {
      await new Promise<void>((r) => setTimeout(r, 700));
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="name" className={styles.inputLabel}>
          Ім&#39;я
        </label>
        <input
          type="text"
          id="name"
          className={styles.inputField}
          placeholder="Ваше ім'я"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.inputLabel}>
          Email
        </label>
        <input
          type="email"
          id="email"
          className={styles.inputField}
          placeholder="example@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="message" className={styles.inputLabel}>
          Повідомлення
        </label>
        <textarea
          id="message"
          className={styles.textareaField}
          placeholder="Текст повідомлення..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting}
      >
        {isSubmitting ? "НАДСИЛАННЯ..." : sent ? "НАДІСЛАНО" : "НАДІСЛАТИ"}
      </button>
    </form>
  );
}
