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
import crypto from "crypto";
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

// ---------- 누적 병합 (90일 보관) ----------
// 새로 수집한 결과를 기존 스냅샷에 합친다. 게시물/광고 고유 id 기준 중복 제거:
//  - 기존에 있던 항목 → 최신 데이터로 갱신(조회수·좋아요 등), 단 firstSeen 은 유지.
//  - 처음 본 항목 → firstSeen/lastSeen 기록.
//  - 이번 수집에 없던 과거 항목 → 그대로 보존(누적). 단 보관기간(90일) 지나면 제거.
const RETENTION_DAYS = 90;

function refDateMs(a: Ad): number {
  const d = new Date((a.date ?? "").replace(" ", "T")).getTime();
  if (!Number.isNaN(d)) return d;
  const f = new Date(a.firstSeen ?? "").getTime();
  return Number.isNaN(f) ? Date.now() : f;
}

export async function mergeSnapshot(
  kind: "ads" | "organic",
  fresh: Ad[]
): Promise<{ total: number; added: number; updated: number }> {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const prev = (await readSnapshot(kind))?.ads ?? [];
  const map = new Map<string, Ad>();
  for (const a of prev) map.set(a.id, a);

  let added = 0;
  let updated = 0;
  for (const f of fresh) {
    const old = map.get(f.id);
    if (old) {
      map.set(f.id, { ...f, firstSeen: old.firstSeen ?? old.date ?? nowIso, lastSeen: nowIso });
      updated++;
    } else {
      map.set(f.id, { ...f, firstSeen: nowIso, lastSeen: nowIso });
      added++;
    }
  }

  const merged = [...map.values()].filter(
    (a) => nowMs - refDateMs(a) <= RETENTION_DAYS * 86_400_000
  );

  const dir = await writableDir();
  const snap: Snapshot = { collectedAt: nowIso, source: "apify", ads: merged };
  await fs.writeFile(path.join(dir, fileName(kind)), JSON.stringify(snap), "utf8");
  return { total: merged.length, added, updated };
}

// ---------- 이미지 캐시 미리 데우기 ----------
// 수집 시점(링크가 살아있을 때) 각 이미지를 받아 /data/img-cache 에 저장해 둔다.
// /api/img 와 동일한 키(서명 제외 경로의 sha1)·동일 디렉터리를 써서 이후 프록시가 그대로 재사용.
const IMG_CACHE_DIR = path.join(process.env.DATA_DIR?.trim() || "/data", "img-cache");
const IMG_HOSTS = ["cdninstagram.com", "fbcdn.net", "fna.fbcdn.net"];
const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif"]);

function imgCacheFile(u: string): string | null {
  try {
    const t = new URL(u);
    if (!IMG_HOSTS.some((h) => t.hostname.endsWith(h))) return null;
    const ext0 = (path.extname(t.pathname).toLowerCase() || ".jpg").slice(0, 6);
    const safe = IMG_EXTS.has(ext0) ? ext0 : ".jpg";
    const hash = crypto.createHash("sha1").update(t.pathname).digest("hex");
    return path.join(IMG_CACHE_DIR, hash + safe);
  } catch {
    return null;
  }
}

export async function warmImageCache(ads: Ad[]): Promise<number> {
  const urls = Array.from(
    new Set(ads.map((a) => a.imageUrl).filter((x): x is string => Boolean(x)))
  );
  let saved = 0;
  try {
    await fs.mkdir(IMG_CACHE_DIR, { recursive: true });
  } catch {
    return 0;
  }
  const BATCH = 6;
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(
      urls.slice(i, i + BATCH).map(async (u) => {
        const file = imgCacheFile(u);
        if (!file) return;
        try {
          await fs.access(file);
          return; // 이미 캐시됨
        } catch {
          /* 미스 → 받기 */
        }
        try {
          const r = await fetch(u, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
              Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
            },
            cache: "no-store",
          });
          if (!r.ok) return;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length > 0) {
            await fs.writeFile(file, buf);
            saved++;
          }
        } catch {
          /* 실패 무시 */
        }
      })
    );
  }
  return saved;
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


// ---------- 차단목록(blocklist): 저장본에서 특정 계정/이름 제외 (Apify 재호출 없음) ----------
const BLOCK_FILE = "forus-blocklist.json";

export async function readBlocklist(): Promise<string[]> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, BLOCK_FILE), "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.map((x) => String(x).toLowerCase());
    } catch {
      /* 다음 후보 */
    }
  }
  return [];
}

async function writeBlocklist(list: string[]): Promise<void> {
  const dir = await writableDir();
  const uniq = Array.from(new Set(list.map((x) => x.toLowerCase()).filter(Boolean)));
  await fs.writeFile(path.join(dir, BLOCK_FILE), JSON.stringify(uniq), "utf8");
}

export async function addToBlocklist(entry: string): Promise<string[]> {
  const e = entry.trim().toLowerCase();
  const list = await readBlocklist();
  if (e && !list.includes(e)) list.push(e);
  await writeBlocklist(list);
  return list;
}

export async function removeFromBlocklist(entry: string): Promise<string[]> {
  const e = entry.trim().toLowerCase();
  const list = (await readBlocklist()).filter((x) => x !== e);
  await writeBlocklist(list);
  return list;
}

/** 차단목록(핸들 또는 클리닉명)에 걸리는 광고를 제거 */
export function applyBlocklist(ads: Ad[], block: string[]): Ad[] {
  if (block.length === 0) return ads;
  const set = new Set(block);
  return ads.filter((a) => {
    const h = a.igUsername?.toLowerCase();
    const n = a.clinic?.toLowerCase();
    return !((h && set.has(h)) || (n && set.has(n)));
  });
}


// ---------- 병원 등록 요청 (공개 폼 → 서버 저장, 관리자 조회) ----------
const REQ_FILE = "forus-register-requests.json";

export interface RegisterRequest {
  id: string;
  clinic: string;
  instagram: string;
  area?: string;
  contact?: string;
  message?: string;
  createdAt: string;
}

export async function readRegisterRequests(): Promise<RegisterRequest[]> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, REQ_FILE), "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as RegisterRequest[];
    } catch {
      /* 다음 후보 */
    }
  }
  return [];
}

export async function addRegisterRequest(
  r: Omit<RegisterRequest, "id" | "createdAt">
): Promise<RegisterRequest> {
  const list = await readRegisterRequests();
  const entry: RegisterRequest = {
    ...r,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, REQ_FILE), JSON.stringify(list), "utf8");
  return entry;
}


// ---------- 승인된 병원(워치리스트) + 등록요청 처리 ----------
const APPROVED_FILE = "forus-approved-clinics.json";

export interface ApprovedClinic {
  name: string;
  handle: string; // @ 제외 소문자
  areas: string[]; // ["강남"] 등, 기타는 []
  instagram: string; // 원문 입력
  addedAt: string;
}

export async function readApprovedClinics(): Promise<ApprovedClinic[]> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, APPROVED_FILE), "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as ApprovedClinic[];
    } catch {
      /* 다음 후보 */
    }
  }
  return [];
}

export async function addApprovedClinic(entry: ApprovedClinic): Promise<void> {
  const list = await readApprovedClinics();
  const h = entry.handle.toLowerCase();
  const next = list.filter((c) => c.handle.toLowerCase() !== h);
  next.unshift({ ...entry, handle: h });
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, APPROVED_FILE), JSON.stringify(next), "utf8");
}

export async function removeApprovedClinic(handle: string): Promise<void> {
  const list = await readApprovedClinics();
  const h = handle.toLowerCase();
  const next = list.filter((c) => c.handle.toLowerCase() !== h);
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, APPROVED_FILE), JSON.stringify(next), "utf8");
}

export async function removeRegisterRequest(id: string): Promise<void> {
  const list = await readRegisterRequests();
  const next = list.filter((r) => r.id !== id);
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, REQ_FILE), JSON.stringify(next), "utf8");
}


// 단일 게시물 제외 — 현재 스냅샷에서만 제거(다음 수집 때 다시 들어옴). 차단(blocklist)과 다름.
export async function removeAdById(id: string): Promise<boolean> {
  let removed = false;
  for (const kind of ["ads", "organic"] as const) {
    const snap = await readSnapshot(kind);
    if (!snap) continue;
    const next = snap.ads.filter((a) => a.id !== id);
    if (next.length !== snap.ads.length) {
      const dir = await writableDir();
      await fs.writeFile(path.join(dir, fileName(kind)), JSON.stringify({ ...snap, ads: next }), "utf8");
      removed = true;
    }
  }
  return removed;
}


// ---------- 문의 (공개 폼 → 서버 저장, 관리자 조회) ----------
const INQUIRY_FILE = "forus-inquiries.json";

export interface Inquiry {
  id: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
}

export async function readInquiries(): Promise<Inquiry[]> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, INQUIRY_FILE), "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Inquiry[];
    } catch {
      /* 다음 후보 */
    }
  }
  return [];
}

export async function addInquiry(r: Omit<Inquiry, "id" | "createdAt">): Promise<Inquiry> {
  const list = await readInquiries();
  const entry: Inquiry = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  list.unshift(entry);
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, INQUIRY_FILE), JSON.stringify(list), "utf8");
  return entry;
}

export async function removeInquiry(id: string): Promise<void> {
  const list = await readInquiries();
  const next = list.filter((r) => r.id !== id);
  const dir = await writableDir();
  await fs.writeFile(path.join(dir, INQUIRY_FILE), JSON.stringify(next), "utf8");
}
