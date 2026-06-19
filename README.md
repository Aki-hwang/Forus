# Forus

🔗 **라이브:** https://forus-advertising.up.railway.app/ (Railway · `main` 브랜치 자동 배포)

일본(향후 중국) 관광객을 타겟하는 **피부과 광고 트렌드 대시보드 + AI 광고 생성기**.

강남·명동·홍대 피부과들이 **지금 집행 중인 실제 광고**(Meta 광고 라이브러리)를 시술별로
모아 트렌드를 읽고, 카드를 누르면 **원본 광고/사이트로 바로 이동**합니다. 각 광고는
레퍼런스로 삼아 **우리 광고를 자동 생성**할 수도 있습니다.

## 핵심 기능 (MVP)

- **실시간 광고 수집** — Meta(페이스북) 광고 라이브러리에서 지역별 키워드로 활성 광고를 수집
- **시술별 그룹 대시보드** — 본문 카피에서 시술/지역/스타일/언어를 자동 분류해 시술별 섹션으로 노출
- **클릭 → 원본 광고로 이동** — 카드 클릭 시 광고 랜딩(LINE/인스타/홈페이지)으로 바로 연결
- **클릭 → AI 광고 자동 생성** — 카드의 `✨ 생성` 버튼으로 레퍼런스 기반 우리 병원 버전 크리에이티브 + 일본어/중국어 캡션·해시태그 생성
- **소셜 로그인 / 회원가입** — Google·Naver 계정으로 로그인(첫 로그인 시 자동 회원가입). Auth.js v5 기반, JWT 쿠키 세션(별도 DB 불필요)

> 데이터는 **Apify(Meta 광고 라이브러리) 수집 + 목업 폴백** 구조입니다. `APIFY_TOKEN` 이
> 설정되면 `src/lib/adQueries.ts` 의 지역별 검색어로 활성 광고를 긁어와 본문에서 시술·
> 스타일·언어를 추론해 매핑하고, 토큰이 없거나 수집에 실패하면 자동으로
> 목업(`src/lib/ads.ts`)으로 폴백합니다.
>
> ⚠️ 광고 라이브러리는 상업광고의 노출수·조회수를 제공하지 않습니다. 조회수/좋아요 등
> 인게이지먼트는 추후 **2단계: 인스타그램 연동**에서 보강할 예정입니다(현재는 집행 일수·
> 노출 플랫폼만 표시).

## 실시간 수집 (Apify)

1. [Apify](https://console.apify.com/settings/integrations) 에서 API 토큰 발급
2. `.env.example` 를 참고해 `.env.local`(로컬) 또는 Railway Variables 에 `APIFY_TOKEN` 설정
3. 지역별 검색어는 `src/lib/adQueries.ts` 에서 관리하며, **ISO 주차 기준 주 1회 로테이션**됩니다
4. 대시보드 상단 배지로 **실시간 수집 / 목업** 상태를 확인할 수 있습니다

| 환경변수 | 설명 | 기본값 |
| --- | --- | --- |
| `APIFY_TOKEN` | Apify API 토큰 (없으면 목업 폴백) | — |
| `APIFY_AD_ACTOR` | 사용할 액터 | `curious_coder/facebook-ads-library-scraper` |
| `APIFY_AD_COUNT` | 전체 목표 수집 건수 (지역당 최소 10) | `30` |
| `APIFY_TTL_SECONDS` | 수집 결과 캐시 TTL(초) | `604800` (7일) |

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- 생성 로직: `src/lib/generate.ts` (템플릿 + 변형 시드 기반 → 추후 LLM/이미지 생성 API로 core 교체)

## 폴더 구조

```
src/
  auth.ts                  Auth.js v5 설정 (Google·Naver, JWT 세션)
  app/
    page.tsx               메인 대시보드
    layout.tsx             폰트/메타데이터 + SessionProvider
    globals.css            디자인 토큰
    login/page.tsx         로그인 / 회원가입 페이지
    api/ads/route.ts       광고 목록 API (Apify 광고 라이브러리 수집 → 목업 폴백)
    api/generate/route.ts  광고 생성 API
    api/auth/[...nextauth]/route.ts  Auth.js 인증 엔드포인트
  components/
    Header.tsx             로그인 상태 / 유저 메뉴
    Providers.tsx          SessionProvider 래퍼
    TrendPanel.tsx         트렌드 지표 패널
    FilterBar.tsx          지역/시술 필터
    AdCard.tsx             갤러리 카드 (클릭 → 원본 광고 / ✨ 생성)
    CreativeCard.tsx       광고 크리에이티브 비주얼 (공용)
    AdDetailModal.tsx      상세 + AI 생성 플로우
  lib/
    ads.ts                 데이터 모델 + 목업 데이터 + 트렌드 집계
    adQueries.ts           지역별 광고 라이브러리 검색어 (주 1회 로테이션)
    apify.ts               광고 라이브러리 수집 → Ad 매핑 (시술/스타일/언어 추론)
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

## 인증 (로그인 / 회원가입)

Google·Naver 소셜 로그인을 사용합니다. 코드는 준비되어 있고 **환경변수만 채우면** 동작합니다.

1. `cp .env.example .env.local`
2. 비밀키 생성: `npx auth secret` (또는 `openssl rand -base64 32`) → `AUTH_SECRET`
3. **Google**: [Cloud Console → 사용자 인증 정보](https://console.cloud.google.com/apis/credentials)에서 OAuth 클라이언트(웹) 생성
   - 승인된 리디렉션 URI: `{사이트}/api/auth/callback/google` (개발: `http://localhost:3000/...`)
   - 발급값 → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
4. **Naver**: [Naver Developers](https://developers.naver.com/apps/#/register)에서 앱 등록(네이버 로그인)
   - Callback URL: `{사이트}/api/auth/callback/naver`
   - 발급값 → `AUTH_NAVER_ID`, `AUTH_NAVER_SECRET`
5. 배포 시 위 값들을 **Railway Variables** 에 등록하고, `AUTH_URL` 을 운영 도메인으로 지정

> 관련 코드: `src/auth.ts`(설정), `src/app/api/auth/[...nextauth]/route.ts`(엔드포인트), `src/app/login/page.tsx`(로그인 페이지). Railway 등 Vercel 외 호스팅 대응으로 `trustHost: true` 설정됨.
> **Naver 참고:** `expires_in` 비표준 응답으로 `OperationProcessingError` 가 나면 `src/auth.ts` 주석의 `token.conform` 보정 코드를 적용하세요.

## 배포 (Railway)

1. Railway에서 New Project → Deploy from GitHub repo → 이 저장소 선택
2. Railway가 Nixpacks로 자동 감지하여 `npm run build` → `npm start` 실행 (`railway.json` 참고)
3. `PORT` 는 Railway가 자동 주입하며 `next start` 가 이를 사용합니다 (별도 설정 불필요)
4. Settings → Networking 에서 도메인 생성

## 로드맵

- [x] 실제 광고 수집 — Meta 광고 라이브러리 (지역별 키워드, 주 1회 로테이션)
- [x] 클릭 시 원본 광고(인스타그램)로 이동 + 등록 클리닉 태그
- [x] **2단계: 인스타그램 조회수 보강** — 광고주 IG 릴스 조회수(중앙값)로 정렬·지표 (`/api/ads/views`)
- [ ] 일본어 키워드 비중 강화 / JP·CN 필터 토글
- [ ] 실제 이미지 생성 API 연동 (`generate.ts` 의 `imagePrompt` 활용)
- [ ] 광고 저장함 / 캠페인 관리
- [x] 인증 (Google·Naver 소셜 로그인 / 회원가입)
- [ ] 병원 계정 · 사용자별 데이터(DB) 연동
