# Forus

🔗 **라이브:** https://forus-advertising.up.railway.app/ (Railway · `main` 브랜치 자동 배포)

일본(향후 중국) 관광객을 타겟하는 **피부과 광고 트렌드 대시보드 + AI 광고 생성기**.

강남·명동·홍대 피부과들이 인스타에 올리는 광고를 한눈에 모아 트렌드를 읽고,
마음에 드는 광고를 클릭하면 그걸 레퍼런스로 **우리 광고(인스타용)를 자동 생성**합니다.

## 핵심 기능 (MVP)

- **광고 트렌드 대시보드** — 지역(강남/명동/홍대)·시술별 분포, 인기 키워드, 컬러 무드, 인게이지먼트 지표
- **광고 갤러리** — 지역/시술 필터로 광고를 인스타 카드 형태로 탐색
- **클릭 → AI 광고 자동 생성** — 레퍼런스의 시술·카피 톤·컬러 무드를 분석해 우리 병원 버전의 크리에이티브 + 일본어/중국어 캡션·해시태그를 생성, 캡션 복사 / 다른 버전 생성 지원

> 데이터는 **Apify 인스타그램 수집 + 목업 폴백** 구조입니다. `APIFY_TOKEN` 이 설정되면
> `src/lib/clinics.ts` 에 등록된 클리닉 계정의 최신 게시물을 Apify로 긁어와 캡션에서
> 시술·스타일·언어를 추론해 광고로 매핑하고, 토큰이 없거나 수집에 실패하면 자동으로
> 목업(`src/lib/ads.ts`)으로 폴백합니다.

## 실시간 수집 (Apify)

1. [Apify](https://console.apify.com/account/integrations) 에서 API 토큰 발급
2. `.env.example` 를 참고해 `.env.local` 에 `APIFY_TOKEN` 설정
3. 수집 대상은 `src/lib/clinics.ts` 의 `CLINIC_ACCOUNTS` (또는 `APIFY_IG_PROFILES` 환경변수)로 관리
4. 대시보드 상단 배지로 **실시간 수집 / 목업** 상태를 확인할 수 있습니다

| 환경변수 | 설명 | 기본값 |
| --- | --- | --- |
| `APIFY_TOKEN` | Apify API 토큰 (없으면 목업 폴백) | — |
| `APIFY_INSTAGRAM_ACTOR` | 사용할 액터 | `apify/instagram-scraper` |
| `APIFY_RESULTS_LIMIT` | 계정당 게시물 수 | `6` |
| `APIFY_TTL_SECONDS` | 수집 결과 캐시 TTL(초) | `3600` |
| `APIFY_IG_PROFILES` | 수집 대상 핸들 직접 지정(콤마) | `clinics.ts` 기본 목록 |

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- 생성 로직: `src/lib/generate.ts` (템플릿 + 변형 시드 기반 → 추후 LLM/이미지 생성 API로 core 교체)

## 폴더 구조

```
src/
  app/
    page.tsx               메인 대시보드
    layout.tsx             폰트/메타데이터
    globals.css            디자인 토큰
    api/ads/route.ts       광고 목록 API (Apify 수집 → 목업 폴백)
    api/generate/route.ts  광고 생성 API
  components/
    Header.tsx
    TrendPanel.tsx         트렌드 지표 패널
    FilterBar.tsx          지역/시술 필터
    AdCard.tsx             갤러리 카드
    CreativeCard.tsx       광고 크리에이티브 비주얼 (공용)
    AdDetailModal.tsx      상세 + AI 생성 플로우
  lib/
    ads.ts                 데이터 모델 + 목업 데이터 + 트렌드 집계
    clinics.ts             Apify 수집 대상 클리닉 계정 설정
    apify.ts               Apify 인스타 수집 → Ad 매핑 (시술/스타일/언어 추론)
    generate.ts            레퍼런스 기반 광고 생성기
```

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build
npm start        # PORT 환경변수 사용 (기본 3000)
```

## 배포 (Railway)

1. Railway에서 New Project → Deploy from GitHub repo → 이 저장소 선택
2. Railway가 Nixpacks로 자동 감지하여 `npm run build` → `npm start` 실행 (`railway.json` 참고)
3. `PORT` 는 Railway가 자동 주입하며 `next start` 가 이를 사용합니다 (별도 설정 불필요)
4. Settings → Networking 에서 도메인 생성

## 로드맵

- [x] 실제 광고 수집 — Apify 인스타그램 스크래퍼 (클리닉 계정 프로필)
- [ ] Meta 광고 라이브러리 API 수집 소스 추가
- [ ] 실제 이미지 생성 API 연동 (`generate.ts` 의 `imagePrompt` 활용)
- [ ] 광고 저장함 / 캠페인 관리
- [ ] 중국어 타겟 본격 확장
- [ ] 인증 / 병원 계정
