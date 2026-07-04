import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway(Nixpacks)는 `npm run build` 후 `npm start`(next start)로 구동됩니다.
  // next start 는 PORT 환경변수를 자동으로 사용합니다.

  // 응답 gzip 압축(기본값이지만 명시) — 스냅샷 JSON(수백 KB)이 ~1/8로 줄어 로딩이 빨라진다.
  compress: true,
};

export default nextConfig;
