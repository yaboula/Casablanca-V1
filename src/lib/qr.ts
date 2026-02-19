import QRCode from "qrcode";

/**
 * Generate a QR code as an SVG string.
 * Used by the Smart Ticket to render the boarding-pass QR.
 */
export async function generateQRCodeSVG(hash: string): Promise<string> {
  return QRCode.toString(hash, {
    type: "svg",
    margin: 1,
    color: { dark: "#0F172A", light: "#FFFFFF" },
    width: 200,
  });
}
