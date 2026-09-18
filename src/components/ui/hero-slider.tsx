"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./hero-slider.module.scss";

const AUTOPLAY_MS = 5000;
const FIRST_SLIDE_MS = 15000;
const SWIPE_THRESHOLD = 50;
const PREMIUM_EASE = [0.25, 0.1, 0.25, 1] as const;

const slides = [
  {
    id: "gerard",
    tab: "Dr. Gerard",
    title: "Легендарне польське печиво Dr. Gerard",
    description:
      "Справжні солодощі для гуртових та роздрібних замовлень. Хіти смаку: Pasja, Mafijne та ChocoBears за прямими цінами імпортера.",
    buttonText: "Переглянути асортимент",
    href: "/catalog?category=dr-gerard",
    label: "Оригінальна європейська якість",
    highlight: "Опт від 1 ящика • Швидка доставка по всій Україні",
    bg: "/images/hero/dr-gerard/desktop.jpg",
    bgMobile: "/images/hero/dr-gerard/mobile.webp",
    tone: "light" as const,
  },
  {
    id: "premium",
    tab: "Європейський імпорт",
    title: "Елітні продукти з самого серця Європи",
    description: "Тільки оригінальна якість та перевірені бренди.",
    buttonText: "Перейти до каталогу",
    href: "/catalog",
    label: "Premium Selection",
    bg: "/images/hero/default/desktop.jpg",
    bgMobile: "/images/hero/default/mobile.jpg",
    tone: "dark" as const,
  },
];

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(FIRST_SLIDE_MS);
  const timerGen = useRef(0);
  const slide = slides[currentIndex];
  const isLight = slide.tone === "light";

  const bump = useCallback((nextIndex: (i: number) => number) => {
    remainingRef.current = AUTOPLAY_MS;
    timerGen.current += 1;
    setCurrentIndex(nextIndex);
    setCycle((c) => c + 1);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      bump(() => ((next % slides.length) + slides.length) % slides.length);
    },
    [bump],
  );

  const goDelta = useCallback(
    (delta: number) => {
      bump((i) => (i + delta + slides.length) % slides.length);
    },
    [bump],
  );

  useEffect(() => {
    if (paused) return;
    const gen = timerGen.current;
    const started = Date.now();
    const allocated = remainingRef.current;
    const timer = window.setTimeout(() => {
      if (timerGen.current !== gen) return;
      remainingRef.current = AUTOPLAY_MS;
      goDelta(1);
    }, allocated);
    return () => {
      window.clearTimeout(timer);
      if (timerGen.current !== gen) return;
      remainingRef.current = Math.max(0, allocated - (Date.now() - started));
    };
  }, [currentIndex, cycle, paused, goDelta]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (
        Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
        Math.abs(info.velocity.x) > 500
      ) {
        goDelta(info.offset.x < 0 ? 1 : -1);
      }
    },
    [goDelta],
  );

  const onHoverPause = (next: boolean) => {
    if (
      typeof window !== "undefined" &&
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }
    setPaused(next);
  };

  const [mountedSlides, setMountedSlides] = useState(() => new Set([0]));

  useEffect(() => {
    setMountedSlides((prev) => {
      if (prev.has(currentIndex)) return prev;
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
  }, [currentIndex]);

  const ink = isLight ? "text-[#1c1917]" : "text-white";
  const inkMuted = isLight ? "text-[#111]/55" : "text-white/55";
  const track = isLight ? "bg-[#111]/15" : "bg-white/25";
  const arrowClass = isLight
    ? "border-[#111]/15 bg-white/45 text-[#111] hover:bg-white/70"
    : "border-white/20 bg-black/30 text-white hover:bg-black/45";

  return (
    <section
      className="group relative flex w-full flex-col overflow-hidden bg-[#011B44]"
      onMouseEnter={() => onHoverPause(true)}
      onMouseLeave={() => onHoverPause(false)}
    >
      <div className="pointer-events-none relative h-[88vh] min-h-[640px] w-full select-none md:h-[85vh] md:min-h-0">
        {slides.map((item, index) => {
          const isLcp = index === 0;
          const showImage = mountedSlides.has(index);
          const visible = currentIndex === index;
          const frame = showImage ? (
            <>
              <div className="relative hidden h-full w-full md:block">
                <Image
                  src={item.bg}
                  alt={item.title}
                  fill
                  quality={75}
                  fetchPriority={isLcp ? "high" : "low"}
                  loading={isLcp ? "eager" : "lazy"}
                  className="object-cover"
                  sizes="(min-width: 768px) 100vw, 0px"
                />
              </div>
              <div className="relative block h-full w-full md:hidden">
                <Image
                  src={item.bgMobile}
                  alt={item.title}
                  fill
                  quality={75}
                  unoptimized={isLcp}
                  priority={isLcp}
                  fetchPriority={isLcp ? "high" : "low"}
                  loading={isLcp ? "eager" : "lazy"}
                  className="object-cover object-center"
                  sizes={isLcp ? "100vw" : "(max-width: 767px) 100vw, 0px"}
                />
              </div>
            </>
          ) : null;

          if (isLcp) {
            return (
              <div
                key={item.id}
                className="absolute inset-0 h-full w-full"
                style={{ opacity: visible ? 1 : 0 }}
              >
                {frame}
              </div>
            );
          }

          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={{ opacity: visible ? 1 : 0 }}
              transition={{ duration: 1.2, ease: PREMIUM_EASE }}
              className="absolute inset-0 h-full w-full"
            >
              {frame}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute inset-0 z-[2] md:pointer-events-none"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
      />

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex h-full w-full flex-col items-center px-4 text-center md:items-start md:justify-center md:px-16 md:pb-28 md:pt-0 md:text-left lg:px-20 ${
          isLight ? "justify-start pb-[52%] pt-5" : "justify-start pb-24 pt-12"
        }`}
      >
        <div className="flex w-full flex-col items-center gap-3 md:w-[60%] md:items-start md:gap-8 lg:w-[45%]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={cycle === 0 ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={cycle === 0 ? undefined : { opacity: 0, y: -20 }}
              transition={{
                duration: cycle === 0 ? 0 : 0.8,
                ease: PREMIUM_EASE,
                delay: 0,
              }}
              className={`flex w-full flex-col items-center md:items-start ${
                isLight
                  ? "rounded-sm bg-white/70 px-3 py-3 md:bg-transparent md:px-0 md:py-0"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center gap-2 md:items-start md:gap-4">
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.18em] md:mb-2 md:text-[11px] md:tracking-[0.28em] ${
                    isLight ? "text-[#111]/70" : "text-white/80"
                  }`}
                >
                  {slide.label}
                </span>
                <p
                  className={`max-w-[18ch] font-heading text-[1.45rem] font-bold leading-[1.12] sm:text-4xl md:max-w-[15ch] md:text-5xl lg:text-6xl ${
                    isLight
                      ? "text-[#1c1917]"
                      : "text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {slide.title}
                </p>
              </div>

              <p
                className={`mt-2 max-w-[45ch] text-[13px] font-semibold leading-snug tracking-wide sm:text-base md:mt-8 md:text-lg md:leading-relaxed lg:text-xl ${
                  isLight
                    ? "text-[#111]/80"
                    : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                }`}
              >
                {slide.description}
              </p>

              {slide.highlight ? (
                <p
                  className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] md:mt-4 md:text-xs md:tracking-[0.16em] ${
                    isLight ? "text-[#111]/65" : "text-white/75"
                  }`}
                >
                  {slide.highlight}
                </p>
              ) : null}

              <Link
                href={slide.href}
                className="pointer-events-auto group/cta relative mt-3 inline-flex items-center justify-center overflow-hidden rounded-md bg-[#C5A059] px-6 py-3 shadow-[0_10px_30px_rgba(197,160,89,0.3)] transition-shadow duration-300 ease-in-out hover:shadow-[0_15px_40px_rgba(197,160,89,0.4)] md:mt-10 md:px-12 md:py-5"
              >
                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#111] md:text-xs md:tracking-[0.28em]">
                  {slide.buttonText}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover/cta:translate-x-full" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-[1] ${
          isLight
            ? "bg-gradient-to-b from-white/50 via-white/10 to-transparent md:bg-gradient-to-r md:from-white/35 md:via-white/5 md:to-transparent"
            : "bg-gradient-to-b from-black/30 via-transparent to-black/10 md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent"
        }`}
      />

      <button
        type="button"
        aria-label="Попередній слайд"
        onClick={() => goDelta(-1)}
        className={`absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity duration-300 md:flex ${arrowClass} pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100`}
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label="Наступний слайд"
        onClick={() => goDelta(1)}
        className={`absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity duration-300 md:flex ${arrowClass} pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100`}
      >
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>

      <div
        role="tablist"
        aria-label="Кампанії"
        className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[min(100%-2rem,720px)] -translate-x-1/2 items-end gap-2 pb-3 md:bottom-7 md:pb-0 md:gap-6"
      >
        {slides.map((item, index) => {
          const active = index === currentIndex;
          const n = padIndex(index + 1);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${n} • ${item.tab}`}
              onClick={() => goTo(index)}
              className={`flex min-w-0 flex-col gap-2 text-left transition-opacity duration-300 ${
                active ? "flex-[1.4]" : "flex-1 md:flex-[1.4]"
              } ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <span
                className={`truncate font-heading text-[10px] uppercase tracking-[0.14em] md:text-[11px] md:tracking-[0.2em] ${
                  active ? `font-bold ${ink}` : `font-medium ${inkMuted}`
                }`}
              >
                <span className="tabular-nums lining-nums">{n}</span>
                <span className={active ? "inline" : "hidden md:inline"}>
                  {" • "}
                  {item.tab}
                </span>
              </span>
              <span className={`block h-[2px] w-full overflow-hidden ${track}`}>
                {active ? (
                  <span
                    key={`${item.id}-${cycle}`}
                    className={styles.progressFill}
                    style={{
                      animationDuration: `${cycle === 0 ? FIRST_SLIDE_MS : AUTOPLAY_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
