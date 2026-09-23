"use client";

import { useEffect } from "react";

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/i;

type GtmWindow = Window & { dataLayer?: Array<Record<string, unknown>> };

export function DelayedGtm({ gtmId }: { gtmId: string }) {
  useEffect(() => {
    if (!GTM_ID_RE.test(gtmId)) return;

    let loaded = false;
    let timeoutId: number | undefined;

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

    const events = ["touchstart", "click", "scroll"] as const;
    const listenerOpts: AddEventListenerOptions = { once: true, passive: true };

    function cleanup() {
      events.forEach((event) => window.removeEventListener(event, load));
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    }

    events.forEach((event) =>
      window.addEventListener(event, load, listenerOpts),
    );

    timeoutId = window.setTimeout(load, 7000);

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
