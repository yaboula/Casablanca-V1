"use client";

/**
 * Syncs the <html> element's `lang` attribute with the Zustand locale store.
 * Also handles manual Zustand rehydration from localStorage AFTER React's
 * first commit — this prevents server/client hydration mismatches that caused
 * layout glitches when the stored locale differed from the default "es".
 */
import { useEffect } from "react";
import { useLocaleStore } from "@/lib/i18n";

export default function HtmlDirSync() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    // Rehydrate Zustand from localStorage now that React has committed
    // the initial (server-matching) render. This makes the locale switch
    // a clean state update rather than a hydration collision.
    // onRehydrateStorage in the store will call setHasHydrated(true) when done.
    useLocaleStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
