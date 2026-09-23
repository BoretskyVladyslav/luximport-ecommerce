"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { withHeroRev } from "@/lib/hero-assets";
import { heroSlides } from "./hero.data";
import styles from "./hero-slider.module.scss";

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 50;
const slides = heroSlides;

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(AUTOPLAY_MS);
  const timerGen = useRef(0);
  const pointerStartX = useRef<number | null>(null);
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

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current == null) return;
    const dx = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      goDelta(dx < 0 ? 1 : -1);
    }
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
  };

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

  const arrowClass = isLight
    ? "border-[#111]/15 bg-white/45 text-[#111] hover:bg-white/70"
    : "border-white/20 bg-black/30 text-white hover:bg-black/45";

  return (
    <section
      className="group relative flex w-full flex-col overflow-hidden bg-[#011B44]"
      onMouseEnter={() => onHoverPause(true)}
      onMouseLeave={() => onHoverPause(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <div className="pointer-events-none relative h-[calc(100svh-5rem)] min-h-[520px] w-full select-none lg:min-h-[640px]">
        {slides.map((item, index) => {
          const isLcp = index === 0;
          const showImage = mountedSlides.has(index);
          const visible = currentIndex === index;
          const desktopAlt = visible ? item.title : "";
          const mobileAlt = visible ? item.title : "";
          const frame = showImage ? (
            <div className="absolute inset-0 overflow-hidden">
              <div className="relative hidden h-full w-full landscape:block lg:block">
                <Image
                  src={withHeroRev(item.bg)}
                  alt={desktopAlt}
                  fill
                  quality={75}
                  unoptimized={isLcp}
                  priority={isLcp}
                  fetchPriority={isLcp ? "high" : "low"}
                  loading={isLcp ? "eager" : "lazy"}
                  className="object-cover object-[70%_center]"
                  sizes="(min-width: 1024px) 100vw, (orientation: landscape) 100vw, 0px"
                />
              </div>
              <div className="relative block h-full w-full landscape:hidden lg:hidden">
                {isLcp ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={withHeroRev(item.bgMobile)}
                    alt={mobileAlt}
                    fetchPriority={isLcp ? "high" : "low"}
                    loading={isLcp ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 50vw"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: item.objectPositionMobile }}
                  />
                ) : (
                  <Image
                    src={withHeroRev(item.bgMobile)}
                    alt={mobileAlt}
                    fill
                    quality={75}
                    fetchPriority="low"
                    loading="lazy"
                    className="object-cover"
                    style={{ objectPosition: item.objectPositionMobile }}
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 50vw"
                  />
                )}
              </div>
            </div>
          ) : null;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                visible ? "opacity-100" : "opacity-0"
              }`}
            >
              {frame}
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 top-1/2 z-[2] touch-pan-y md:pointer-events-none lg:inset-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-[38%] max-h-[38%] w-full flex-col items-center justify-start overflow-hidden px-4 pt-3 text-center sm:px-6 sm:pt-4 md:h-[55%] md:max-h-none md:overflow-visible md:px-8 md:pt-8 lg:inset-0 lg:flex lg:h-full lg:max-h-none lg:items-start lg:justify-center lg:overflow-visible lg:px-16 lg:pb-28 lg:pt-0 lg:text-left xl:px-20">
        <div className="flex w-full max-w-[36rem] flex-col items-center lg:w-[46%] lg:max-w-[500px] lg:items-start">
          <div
            className={`flex w-full flex-col items-center lg:items-start ${
              isLight
                ? "rounded-2xl bg-white/70 px-3 py-2.5 sm:px-4 sm:py-3 md:p-6 lg:bg-transparent lg:p-0"
                : "rounded-2xl bg-black/40 px-3 py-2.5 sm:px-4 sm:py-3 md:p-6 lg:bg-transparent lg:p-0"
            }`}
          >
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 lg:items-start lg:gap-4">
              <span
                className={`text-[9px] font-bold uppercase tracking-[0.18em] sm:text-[10px] lg:mb-2 lg:text-[11px] lg:tracking-[0.28em] ${
                  isLight
                    ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.7)]"
                    : "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]"
                }`}
              >
                {slide.eyebrow}
              </span>
              <p
                className={`line-clamp-1 max-w-[34ch] text-[9px] font-semibold uppercase tracking-[0.08em] md:hidden ${
                  isLight
                    ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.7)]"
                    : "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]"
                }`}
              >
                {slide.highlight}
              </p>
              <h2
                className={`w-full max-w-[18ch] text-balance font-heading text-xl font-bold leading-[1.12] sm:text-2xl md:max-w-none md:text-3xl lg:text-[2.5rem] xl:text-5xl ${
                  isLight
                    ? "text-[#1c1917] [text-shadow:0_1px_8px_rgba(255,255,255,0.55)]"
                    : "text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                }`}
              >
                {slide.title}
              </h2>
            </div>

            <p
              className={`mt-2 hidden w-full max-w-[45ch] text-[12px] font-semibold leading-snug tracking-wide md:mt-3 md:block md:text-sm lg:mt-6 lg:text-base lg:leading-relaxed xl:text-lg ${
                isLight
                  ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.55)]"
                  : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              }`}
            >
              {slide.description}
            </p>

            <p
              className={`mt-2 hidden text-[10px] font-semibold uppercase tracking-[0.1em] md:mt-3 md:block lg:mt-4 lg:text-xs lg:tracking-[0.16em] ${
                isLight
                  ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.7)]"
                  : "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]"
              }`}
            >
              {slide.highlight}
            </p>

            <Link
              href={slide.href}
              className="pointer-events-auto group/cta relative mt-2 inline-flex items-center justify-center overflow-hidden rounded-md bg-[#C5A059] px-6 py-2.5 shadow-[0_10px_30px_rgba(197,160,89,0.3)] transition-shadow duration-300 ease-in-out hover:shadow-[0_15px_40px_rgba(197,160,89,0.4)] md:mt-4 lg:mt-10 lg:px-12 lg:py-5"
            >
              <span className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-[#111] sm:text-sm lg:text-xs lg:tracking-[0.28em]">
                {slide.buttonText}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover/cta:translate-x-full" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1/2 lg:hidden">
        <div
          className={`mx-4 mt-4 rounded-2xl border border-white/20 p-5 shadow-lg backdrop-blur-md ${
            isLight ? "bg-white/40" : "bg-black/40"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
              isLight
                ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.7)]"
                : "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]"
            }`}
          >
            {slide.eyebrow}
          </span>
          <h2
            className={`mt-2 line-clamp-3 w-full text-balance font-heading text-xl font-bold leading-[1.12] sm:text-2xl ${
              isLight
                ? "text-[#1c1917] [text-shadow:0_1px_8px_rgba(255,255,255,0.7)]"
                : "text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]"
            }`}
          >
            {slide.title}
          </h2>
          <p
            className={`mt-2 line-clamp-2 text-sm font-medium leading-snug ${
              isLight
                ? "text-stone-800 [text-shadow:0_1px_6px_rgba(255,255,255,0.65)]"
                : "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]"
            }`}
          >
            {slide.description}
          </p>
          <Link
            href={slide.href}
            className="pointer-events-auto mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#C5A059] px-4 text-sm font-medium text-[#111] shadow-md"
          >
            {slide.buttonText}
          </Link>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[1] h-[30%] lg:inset-0 lg:h-full ${
          isLight
            ? "bg-gradient-to-b from-white/50 to-transparent lg:bg-gradient-to-r lg:from-white/35 lg:via-white/5 lg:to-transparent"
            : "bg-gradient-to-b from-black/35 to-transparent lg:bg-gradient-to-r lg:from-black/40 lg:via-transparent lg:to-transparent"
        }`}
      />

      <button
        type="button"
        aria-label="Попередній слайд"
        onClick={() => goDelta(-1)}
        className={`absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity duration-300 lg:flex ${arrowClass} pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100`}
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label="Наступний слайд"
        onClick={() => goDelta(1)}
        className={`absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity duration-300 lg:flex ${arrowClass} pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100`}
      >
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>

      <div
        role="tablist"
        aria-label="Кампанії"
        className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/30 bg-white/45 p-1.5 shadow-lg backdrop-blur-md lg:hidden"
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
              aria-label={`${n} • ${item.titleShort}`}
              onClick={() => goTo(index)}
              className={
                active
                  ? "relative flex h-8 items-center gap-1.5 overflow-hidden rounded-full bg-[#C5A059] px-3.5 text-xs font-medium text-slate-900 shadow-sm transition-all duration-300"
                  : "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-slate-800 transition-all"
              }
            >
              <span className="tabular-nums lining-nums">{n}</span>
              {active ? (
                <span className="whitespace-nowrap">• {item.titleShort}</span>
              ) : null}
              {active ? (
                <span className="pointer-events-none absolute inset-x-2.5 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-slate-900/20">
                  <span
                    key={`${item.id}-${cycle}`}
                    className={styles.progressFillDock}
                    style={{
                      animationDuration: `${AUTOPLAY_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tablist"
        aria-label="Кампанії"
        className="absolute bottom-7 left-1/2 z-20 hidden h-auto w-[min(100%-2rem,900px)] -translate-x-1/2 items-end gap-2 rounded-2xl bg-white/90 px-4 py-2 lg:flex"
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
              className="flex min-w-0 flex-1 flex-col gap-2 text-left"
            >
              <span
                className={`truncate font-heading text-[11px] uppercase tracking-[0.2em] ${
                  active
                    ? "font-bold text-slate-900"
                    : "font-medium text-slate-800"
                }`}
              >
                <span className="tabular-nums lining-nums">{n}</span>
                {" • "}
                {item.tab}
              </span>
              <span className="block h-[2px] w-full overflow-hidden bg-slate-800/20">
                {active ? (
                  <span
                    key={`${item.id}-${cycle}`}
                    className={styles.progressFill}
                    style={{
                      animationDuration: `${AUTOPLAY_MS}ms`,
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
