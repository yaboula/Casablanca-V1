import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NEXUS. — Alquiler de Coches Aeropuerto Casablanca CMN";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F172A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px 96px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px" }}>
            NEXUS
          </span>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#2563EB" }}>.</span>
        </div>

        {/* Center: Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#2563EB",
              borderRadius: 12,
              padding: "12px 24px",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: "2px" }}>
              AEROPUERTO MOHAMMED V · CMN
            </span>
          </div>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
              letterSpacing: "-2px",
            }}
          >
            Tu coche te espera.
          </span>
          <span style={{ fontSize: 36, fontWeight: 500, color: "#64748B" }}>
            Reserva en 2 min · Solo 10€ de señal · Recogida en 3 min
          </span>
        </div>

        {/* Bottom: Metrics row */}
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { value: "3 min", label: "Entrega" },
            { value: "10€", label: "Para reservar" },
            { value: "24/7", label: "Soporte CMN" },
          ].map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#2563EB" }}>{m.value}</span>
              <span style={{ fontSize: 16, color: "#64748B", fontWeight: 500 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
