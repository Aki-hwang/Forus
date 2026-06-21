import { NextResponse } from "next/server";

// 이미지 프록시 — 인스타/Meta CDN 이미지를 서버가 대신 받아 전달(핫링크 차단 우회).
// 화이트리스트 호스트만 허용(오픈 프록시 방지). URL 만료 전이면 정상 표시됨.
export const dynamic = "force-dynamic";

const ALLOWED = ["cdninstagram.com", "fbcdn.net", "fna.fbcdn.net"];

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
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/jpeg",
        // 한번 받으면 하루 캐시 (반복 요청·대역폭 절감)
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
