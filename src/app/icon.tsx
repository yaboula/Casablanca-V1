import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F172A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 96, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-3px" }}>
          N
        </span>
        <span style={{ fontSize: 96, fontWeight: 900, color: "#2563EB" }}>.</span>
      </div>
    ),
    { ...size }
  );
}
