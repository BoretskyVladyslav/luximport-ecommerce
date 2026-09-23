"use client";

import { useEffect } from "react";

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/i;

type GtmWindow = Window & { dataLayer?: Array<Record<string, unknown>> };

export function DelayedGtm({ gtmId }: { gtmId: string }) {
  useEffect(() => {
    if (!GTM_ID_RE.test(gtmId)) return;

    let loaded = false;
    let idleId: number | undefined;
    let ricId: number | undefined;

    const load = () => {
      if (loaded) return;
      loaded = true;
      cleanup();

      const w = window as GtmWindow;
      w.dataLayer = w.dataLayer ?? [];
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(script);
    };

    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const listenerOpts: AddEventListenerOptions = { once: true, passive: true };

    function cleanup() {
      events.forEach((event) => window.removeEventListener(event, load));
      if (idleId !== undefined) {
        window.clearTimeout(idleId);
        idleId = undefined;
      }
      if (ricId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(ricId);
        ricId = undefined;
      }
    }

    events.forEach((event) =>
      window.addEventListener(event, load, listenerOpts),
    );

    if ("requestIdleCallback" in window) {
      ricId = window.requestIdleCallback(() => load(), { timeout: 4000 });
    }
    idleId = window.setTimeout(load, 20000);

    return cleanup;
  }, [gtmId]);

  if (!GTM_ID_RE.test(gtmId)) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
