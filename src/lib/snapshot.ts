// 수집 결과 영구 저장(스냅샷) — "보는 건 공짜, 수집할 때만 과금" 구조의 핵심.
//
// 페이지/조회 API는 이 스냅샷만 읽으므로 Apify를 호출하지 않는다(무료). 실제 수집은
// 보호된 /api/collect 에서만 실행되어 결과를 여기에 기록한다.
//
// 저장 위치: DATA_DIR(기본 /data) — Railway 볼륨을 /data 에 마운트하면 재배포해도 유지된다.
// 볼륨이 없으면 임시 디렉터리로 폴백(인스턴스 한정, 재배포 시 사라짐). 재배포가 잦지 않으면
// 폴백만으로도 "방문마다 재수집"하던 출혈은 사라진다.

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { Ad } from "./ads";

const PRIMARY_DIR = process.env.DATA_DIR?.trim() || "/data";
const FALLBACK_DIR = path.join(os.tmpdir(), "forus-data");

export interface Snapshot {
  collectedAt: string;
  source: "apify";
  ads: Ad[];
}

function fileName(kind: "ads" | "organic"): string {
  return `forus-${kind}.json`;
}

/** 쓰기 가능한 디렉터리 확보 (PRIMARY 우선, 실패 시 FALLBACK) */
async function writableDir(): Promise<string> {
  try {
    await fs.mkdir(PRIMARY_DIR, { recursive: true });
    await fs.access(PRIMARY_DIR);
    return PRIMARY_DIR;
  } catch {
    await fs.mkdir(FALLBACK_DIR, { recursive: true });
    return FALLBACK_DIR;
  }
}

export async function writeSnapshot(kind: "ads" | "organic", ads: Ad[]): Promise<void> {
  const dir = await writableDir();
  const snap: Snapshot = { collectedAt: new Date().toISOString(), source: "apify", ads };
  await fs.writeFile(path.join(dir, fileName(kind)), JSON.stringify(snap), "utf8");
}

export async function readSnapshot(kind: "ads" | "organic"): Promise<Snapshot | null> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, fileName(kind)), "utf8");
      const snap = JSON.parse(raw) as Snapshot;
      if (snap && Array.isArray(snap.ads)) return snap;
    } catch {
      /* 다음 후보 디렉터리 시도 */
    }
  }
  return null;
}
