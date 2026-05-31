import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_IMAGE_CONTENT_TYPE = "image/png";

export function buildOgImageAlt(lineName?: string | null): string {
  if (lineName) {
    return `Bus ${lineName.toUpperCase()} Moventis en temps real · QuanTriga.com`;
  }
  return "QuanTriga.com - Moventis temps real";
}

interface OgImageContentProps {
  lineName?: string;
}

export function OgImageContent({ lineName }: OgImageContentProps) {
  const line = lineName?.toUpperCase();
  const isLineVariant = Boolean(line);

  return (
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
      <div
        style={{
          width: "8px",
          background: "linear-gradient(180deg, #f59e0b 0%, #088b9f 100%)",
        }}
      />

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
        {isLineVariant ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: "120px",
                fontWeight: 800,
                color: "white",
                lineHeight: 1,
                letterSpacing: "-4px",
                textShadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
              }}
            >
              {line}
            </div>
            <div style={{ fontSize: "56px", marginTop: "8px" }}>🚌</div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "140px",
              zIndex: 1,
              filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
            }}
          >
            🚌
          </div>
        )}
      </div>

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
          {isLineVariant ? "Línia Moventis" : "Public Transit Tracker"}
        </div>

        <div
          style={{
            fontSize: isLineVariant ? "52px" : "64px",
            fontWeight: "800",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}
        >
          {isLineVariant ? `Bus ${line} temps real` : "QuanTriga.com"}
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "20px",
            opacity: 0.95,
            color: "#0ff",
          }}
        >
          {isLineVariant ? "Moventis · temps real" : "Temps Real Autobusos"}
        </div>

        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.5,
            opacity: 0.88,
            maxWidth: "400px",
          }}
        >
          {isLineVariant
            ? `Properes arribades, parades al mapa i horaris de la línia ${line} actualitzats.`
            : "Consulta Moventis en temps real i tiempo real: properes arribades a qualsevol parada."}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(15, 176, 195, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          transform: "translate(80px, 80px)",
        }}
      />

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
        {isLineVariant
          ? `quantriga.com/linea/${line?.toLowerCase()}`
          : "quantriga.com"}
      </div>
    </div>
  );
}

export function renderOgImage(lineName?: string | null): ImageResponse {
  return new ImageResponse(
    <OgImageContent lineName={lineName ?? undefined} />,
    { ...OG_IMAGE_SIZE },
  );
}
