<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DermaRadar (Forus) 프로젝트 가이드

## 서비스 개요 — 한 도메인, 세 얼굴
- `/` — 병원 마케터용 B2B 대시보드 (광고·오가닉 트렌드, 클라이언트 컴포넌트)
- `/jp` — 일본인 여행자용 소비자 가이드 (SSR, SEO 타깃)
- `/ko` — 한국인용 시술·이벤트 레이더 (SSR, "지금 뜨는 시술 + 진행 중 이벤트" 포지셔닝)
- 운영 도메인: https://www.dermaradar.kr (⚠️ www 없는 apex는 미연결 상태 — 링크 표기는 항상 풀 주소로)

## 아키텍처 핵심 원칙
1. **"조회는 공짜, 수집할 때만 과금"** — 페이지·API는 `/data` 볼륨의 스냅샷(JSON)만 읽는다.
   실제 Apify 수집은 보호된 `/api/collect`에서만 (자동: 월·금 주 2회, 회당 예산 캡 있음 — `apifyBudget.ts`).
   ⚠️ 새 기능이 Apify를 직접 호출하게 만들지 말 것.
2. 소비자 페이지(/jp·/ko)는 로케일 공용 구조 — 본체는 `src/components/consumer/ConsumerPages.tsx`,
   문안·시술·지역 사전은 `src/lib/consumer.ts`의 `CONSUMER_UI`/`TREATMENT_GUIDES`/`AREA_GUIDES`.
   새 언어(en/tw) 추가 = 사전 번역 + `/en` 라우트 래퍼 4개 복사가 전부.
3. 클리닉 명단 두 종류를 혼동하지 말 것:
   - `KNOWN_CLINICS` (clinics.ts) = **수집 워치리스트 겸용** — 여기 추가하면 수집 대상이 바뀜
   - `KR_CONSUMER_CLINICS` = /ko 표시 전용 — 수집·비용에 영향 없음
4. 의료광고 규제: 소비자 페이지 문안에 효능 보장·최상급 표현 금지, 면책 문구 유지 (`CONSUMER_UI[locale].disclaimer`).

## 개발·배포 워크플로
- 브랜치 → PR → 머지 (main 직접 푸시 금지). 머지되면 Railway가 main을 자동 배포 (2~5분).
- 배포 확인: `https://www.dermaradar.kr/api/status` (볼륨·스냅샷 상태), `/jp`·`/ko` 200 확인.
- Windows 로컬에서 `next build`가 구글폰트 다운로드 문제로 실패할 수 있음 (Linux 배포는 정상).
  로컬 검증은 `npx tsc --noEmit` + dev 서버로. dev도 폰트로 500이 나면 layout.tsx의
  next/font 부분을 임시 비활성 (⚠️ 커밋 금지, 푸시 전 `git checkout -- src/app/layout.tsx`).
- 사이트맵: `src/app/sitemap.ts` (로케일×시술×지역 자동 생성, 현재 59 URL).

## 주요 환경변수 (Railway)
- `APIFY_TOKEN`, `COLLECT_KEY` — 수집 필수
- `ORGANIC_HASHTAGS` (12태그: 한국 지역 3 + 한국 소비자 5 + 일본어 4), `ORGANIC_HASHTAG_CAP=12`
- `NAVER_SITE_VERIFICATION` — 네이버 서치어드바이저 HTML 태그 인증값 (설정 시 메타태그 자동 삽입)

## 백로그 (2026-07-03 기준)
- [ ] PR #6 머지 검토 — 중국어 광고 JP 오분류 수정 (/jp 캠페인 섹션 품질에 직결)
- [ ] apex 도메인(dermaradar.kr) 연결 — 등록처 포워딩 또는 Cloudflare
- [ ] 네이버 서치어드바이저 등록 + NAVER_SITE_VERIFICATION 설정 + 사이트맵 제출
- [ ] 영어판(/en)·번체판(/tw) 확장 — consumer.ts 사전 번역만 하면 됨
- [ ] 월요일 수집 후: 새 해시태그 반영 확인 + DM 타깃 리스트 재추출 (리스트·발송도우미는 로컬 보관, 레포에 커밋 금지)
