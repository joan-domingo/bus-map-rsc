import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QuanTriga.com - Temps Real Autobusos";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #088b9f 0%, #0a7a8a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
        position: "relative",
      }}
    >
      {/* Bus icon */}
      <div
        style={{
          fontSize: "100px",
          marginBottom: "30px",
        }}
      >
        🚌
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        QuanTriga.com
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "32px",
          marginBottom: "30px",
          textAlign: "center",
          opacity: 0.95,
        }}
      >
        Temps Real Autobusos
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "24px",
          textAlign: "center",
          opacity: 0.9,
          maxWidth: "1000px",
          lineHeight: 1.4,
        }}
      >
        Consulta en temps real l'arribada dels propers busos
      </div>

      {/* Bottom attribution */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          right: "40px",
          fontSize: "18px",
          opacity: 0.8,
        }}
      >
        quantriga.com
      </div>
    </div>,
    {
      ...size,
    },
  );
}
