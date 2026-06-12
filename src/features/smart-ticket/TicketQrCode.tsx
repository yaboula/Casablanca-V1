"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type TicketQrCodeProps = {
  ticketToken: string;
};

export function TicketQrCode({ ticketToken }: TicketQrCodeProps) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    QRCode.toString(ticketToken, {
      errorCorrectionLevel: "M",
      margin: 1,
      type: "svg",
      width: 256,
    })
      .then((svg) => {
        if (isMounted) {
          setSvgMarkup(svg);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSvgMarkup(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticketToken]);

  if (!svgMarkup) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Loading QR
      </div>
    );
  }

  return (
    <div
      className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
