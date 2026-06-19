<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Forus 프로젝트 컨텍스트

강남·명동·홍대 피부과의 인스타그램 광고를 수집해 일본/중국 타겟 트렌드를 보여주는 Next.js 대시보드.

## 클리닉 allowlist 업데이트 방법

사용자가 "clinics allowlist 업데이트해줘" 또는 "verify-clinics 돌려줘" 라고 하면:

1. **egress 확인** — 아래 두 도메인이 열려 있어야 함 (환경설정 > 네트워크):
   - `dapi.kakao.com`
   - `openapi.naver.com`

2. **키 확인** — 환경변수에 이미 설정되어 있어야 함:
   - `KAKAO_REST_KEY`
   - `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET`

3. **스크립트 실행** (egress·키 둘 다 확인된 후):
   ```bash
   node scripts/verify-clinics.mjs
   ```
   스크립트가 카카오+네이버로 광고주 검증 → `src/lib/clinics.ts`의 `CLINIC_ALLOWLIST`를 **자동으로 병합·업데이트** → 완료 메시지 출력.

4. **커밋·푸시**:
   ```bash
   git add src/lib/clinics.ts && git commit -m "feat: clinics.ts allowlist 업데이트 (카카오+네이버 검증)" && git push -u origin HEAD
   ```

> egress가 막혀 있으면 (403 "Host not in allowlist") 스크립트는 clinics.ts를 건드리지 않고 종료함.  
> 사용자에게 새 세션 시작을 안내하거나 로컬에서 실행 후 JSON을 붙여달라고 요청할 것.

## 핵심 파일

| 파일 | 설명 |
|---|---|
| `src/lib/clinics.ts` | 클리닉 판별 로직 + `CLINIC_ALLOWLIST` (항상 유지할 클리닉 이름 부분 키워드) |
| `src/lib/apify.ts` | Meta 광고 라이브러리 수집 (Apify) |
| `src/lib/adQueries.ts` | 지역별 검색어 목록 |
| `scripts/verify-clinics.mjs` | 광고주 이름 → 카카오+네이버 검증 → clinics.ts 자동 업데이트 |
| `docs/clinic-detection-method.md` | 클리닉 판별 방법 전체 문서 |
