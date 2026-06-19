import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway(Nixpacks)는 `npm run build` 후 `npm start`(next start)로 구동됩니다.
  // next start 는 PORT 환경변수를 자동으로 사용합니다.
};

export default nextConfig;
