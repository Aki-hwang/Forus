import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DermaRadar — 피부과 광고 트렌드 레이더";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c1a 0%, #1a0f2e 50%, #2d1040 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,63,142,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* 메인 콘텐츠 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 1 }}>
          {/* 배지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", display: "flex" }} />
            <span style={{ color: "#c4b5fd", fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>
              실시간 Meta 광고 수집
            </span>
          </div>

          {/* 타이틀 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#ffffff", letterSpacing: -2, display: "flex" }}>
              Derma
              <span style={{ background: "linear-gradient(90deg, #8b5cf6, #f43f8e)", backgroundClip: "text", color: "transparent" }}>
                Radar
              </span>
            </span>
            <span style={{ fontSize: 28, color: "#d1d5db", fontWeight: 500, letterSpacing: -0.5 }}>
              피부과 광고 트렌드 레이더
            </span>
          </div>

          {/* 설명 */}
          <span style={{ fontSize: 22, color: "#9ca3af", textAlign: "center", maxWidth: 700 }}>
            강남 · 명동 · 홍대 피부과의 일본/중국인 관광객 타겟 광고를 한눈에
          </span>

          {/* 태그 */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {["🇯🇵 일본인", "🇨🇳 중국인", "📊 실시간 수집"].map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 999,
                  color: "#e5e7eb",
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            color: "rgba(156,163,175,0.7)",
            fontSize: 18,
          }}
        >
          forus-advertising.up.railway.app
        </div>
      </div>
    ),
    { ...size }
  );
}
