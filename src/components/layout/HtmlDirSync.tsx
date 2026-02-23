"use client";

/**
 * Syncs the <html> element's `lang` attribute with the Zustand locale store.
 * Also handles manual Zustand rehydration from localStorage AFTER React's
 * first commit — this prevents server/client hydration mismatches that caused
 * layout glitches when the stored locale differed from the default "es".
 */
import { useEffect, useState } from "react";
import { useLocaleStore } from "@/lib/i18n";

export default function HtmlDirSync() {
  const locale = useLocaleStore((s) => s.locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Rehydrate Zustand from localStorage now that React has committed
    useLocaleStore.persist.rehydrate();
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  return null;
}
