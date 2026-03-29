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
        background: "linear-gradient(135deg, #0a7a8a 0%, #05505b 100%)",
        display: "flex",
        alignItems: "stretch",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: "8px",
          background: "linear-gradient(180deg, #f59e0b 0%, #088b9f 100%)",
        }}
      />

      {/* Left visual section with stylized pin */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          paddingLeft: "40px",
        }}
      >
        {/* Large map pin background circle */}
        <div
          style={{
            position: "absolute",
            width: "280px",
            height: "280px",
            background: "rgba(15, 176, 195, 0.15)",
            borderRadius: "50%",
            left: "-40px",
          }}
        />

        {/* Bus + pin visual */}
        <div
          style={{
            fontSize: "140px",
            zIndex: 1,
            filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
          }}
        >
          🚌
        </div>
      </div>

      {/* Right content section */}
      <div
        style={{
          flex: 1.2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "60px",
          paddingLeft: "40px",
          color: "white",
        }}
      >
        {/* Badge/label */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#f59e0b",
            marginBottom: "12px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Public Transit Tracker
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "800",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}
        >
          QuanTriga.com
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "20px",
            opacity: 0.95,
            color: "#0ff",
          }}
        >
          Temps Real Autobusos
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.5,
            opacity: 0.88,
            maxWidth: "400px",
          }}
        >
          Consulta en temps real quan arriba el pròxim autobús a qualsevol parada de Moventis
        </div>
      </div>

      {/* Bottom right corner accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(15, 176, 195, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          transform: "translate(80px, 80px)",
        }}
      />

      {/* URL footer */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "60px",
          fontSize: "16px",
          fontWeight: "500",
          color: "rgba(255, 255, 255, 0.7)",
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
