import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readSnapshot, readBlocklist } from "@/lib/snapshot";

// 무료 상태 점검 — 볼륨/환경변수/저장본 확인용 (Apify 호출 없음).
//   /api/status 로 열어보면 됨.
export const dynamic = "force-dynamic";

async function canWrite(dir: string): Promise<boolean> {
  try {
    await fs.mkdir(dir, { recursive: true });
    const f = path.join(dir, ".write-test");
    await fs.writeFile(f, "ok");
    await fs.unlink(f);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const mountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? null;
  const dataDir = process.env.DATA_DIR?.trim() || "/data";
  const dataWritable = await canWrite(dataDir);
  const ads = await readSnapshot("ads");
  const organic = await readSnapshot("organic");
  const blocklist = await readBlocklist();

  const volumeOk = mountPath === "/data";
  const ready = volumeOk && Boolean(process.env.COLLECT_KEY?.trim()) && Boolean(process.env.APIFY_TOKEN?.trim());

  return NextResponse.json({
    ready,
    volume: {
      railwayMountPath: mountPath,
      mountedAtData: volumeOk,
      dataDir,
      dataWritable,
    },
    env: {
      collectKeySet: Boolean(process.env.COLLECT_KEY?.trim()),
      apifyTokenSet: Boolean(process.env.APIFY_TOKEN?.trim()),
    },
    snapshots: {
      ads: ads ? { count: ads.ads.length, collectedAt: ads.collectedAt } : null,
      organic: organic ? { count: organic.ads.length, collectedAt: organic.collectedAt } : null,
    },
    blocklistCount: blocklist.length,
  });
}
