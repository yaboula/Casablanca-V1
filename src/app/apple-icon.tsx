import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 90, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-3px" }}>
          N
        </span>
        <span style={{ fontSize: 90, fontWeight: 900, color: "#2563EB" }}>.</span>
      </div>
    ),
    { ...size }
  );
}
