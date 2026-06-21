import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// 이미지 프록시 + 볼륨 캐시.
//  - 인스타/Meta CDN 이미지는 핫링크 차단되므로 서버가 대신 받아 전달.
//  - 처음 받을 때(링크 살아있을 때) 볼륨에 파일로 저장 → 이후 인스타 링크가 만료돼도
//    저장본을 계속 서빙(영구 보존). 캐시 키는 쿼리(서명) 제외한 경로 기준이라
//    재수집으로 서명이 바뀌어도 같은 캐시를 재사용한다.
export const dynamic = "force-dynamic";

const ALLOWED = ["cdninstagram.com", "fbcdn.net", "fna.fbcdn.net"];
const CACHE_DIR = path.join(process.env.DATA_DIR?.trim() || "/data", "img-cache");

const CT_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".gif": "image/gif",
};

function cacheInfo(target: URL): { file: string; ct: string } {
  const ext = (path.extname(target.pathname).toLowerCase() || ".jpg").slice(0, 6);
  const safeExt = CT_BY_EXT[ext] ? ext : ".jpg";
  const hash = crypto.createHash("sha1").update(target.pathname).digest("hex");
  return { file: path.join(CACHE_DIR, hash + safeExt), ct: CT_BY_EXT[safeExt] || "image/jpeg" };
}

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return new NextResponse("missing u", { status: 400 });
  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (!ALLOWED.some((h) => target.hostname.endsWith(h))) {
    return new NextResponse("host not allowed", { status: 403 });
  }

  const { file, ct } = cacheInfo(target);
  const headers = (contentType: string) => ({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=604800, s-maxage=604800",
  });

  // 1) 볼륨 캐시 우선 (링크 만료 무관하게 영구 서빙)
  try {
    const cached = await fs.readFile(file);
    return new NextResponse(cached, { status: 200, headers: headers(ct) });
  } catch {
    /* 캐시 미스 → 원본 가져오기 */
  }

  // 2) 원본 fetch → 성공 시 볼륨에 저장하고 서빙
  try {
    const r = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });
    if (!r.ok) return new NextResponse("upstream " + r.status, { status: 502 });
    const buf = Buffer.from(await r.arrayBuffer());
    const upstreamCt = r.headers.get("content-type") || ct;
    if (buf.length > 0) {
      try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(file, buf);
      } catch {
        /* 저장 실패해도 서빙은 진행 */
      }
    }
    return new NextResponse(buf, { status: 200, headers: headers(upstreamCt) });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
