# 로컬 개발 세팅 — 내 컴퓨터에서 머지까지

내 컴퓨터에서 **코드 수정 → 커밋 → 푸시 → PR 생성 → 머지**까지 전부 터미널로 하는 가이드.
머지하면 Railway가 `main`을 자동 배포하므로(2~5분), 머지 = 배포다.

## 1. 설치 (최초 1회)

### Windows (PowerShell)

```powershell
winget install Git.Git
winget install GitHub.cli
winget install OpenJS.NodeJS.LTS
```

설치 후 **PowerShell을 새로 열어야** 명령이 잡힌다.

### Mac

```bash
brew install git gh node
```

## 2. GitHub 로그인 (최초 1회)

```powershell
gh auth login
```

물어보는 대로: **GitHub.com → HTTPS → Login with a web browser** 선택 →
브라우저가 열리면 코드 입력하고 승인. 이걸로 push·PR·머지 권한이 전부 생긴다.

확인:

```powershell
gh auth status
```

## 3. 레포 받기 (최초 1회)

```powershell
git clone https://github.com/Aki-hwang/Forus.git
cd Forus
npm ci
```

## 4. 일상 워크플로 — 수정부터 머지까지

⚠️ `main`에 직접 푸시하지 않는다. 항상 브랜치 → PR → 머지 (AGENTS.md 원칙).

```powershell
# ① 최신 main에서 새 브랜치
git switch main
git pull
git switch -c fix/뭘-고치는지

# ② 코드 수정 후 검증 (Windows는 next build가 폰트 문제로 실패할 수 있어 tsc로)
npx tsc --noEmit

# ③ 커밋 + 푸시
git add -A
git commit -m "fix: 무엇을 왜 고쳤는지"
git push -u origin HEAD

# ④ PR 생성 (제목·본문을 커밋에서 자동으로 채움)
gh pr create --fill

# ⑤ 머지 (스쿼시 + 원격 브랜치 자동 삭제)
gh pr merge --squash --delete-branch
```

⑤까지 하면 Railway가 자동 배포한다. 배포 확인:

- https://www.dermaradar.kr/api/status — 볼륨·스냅샷 상태
- 바꾼 페이지 직접 열어보기 (`/`, `/jp`, `/ko`)

## 5. Claude가 올린 PR을 머지할 때

```powershell
gh pr list                 # 열린 PR 번호 확인
gh pr view 6               # 내용 훑어보기 (--web 붙이면 브라우저로)
gh pr diff 6               # 코드 변경 확인
gh pr merge 6 --squash --delete-branch
```

## 6. 자주 쓰는 명령 요약

| 하고 싶은 것 | 명령 |
|---|---|
| 열린 PR 목록 | `gh pr list` |
| PR 내용 보기 | `gh pr view <번호>` / `--web` |
| PR 머지 | `gh pr merge <번호> --squash --delete-branch` |
| 최신 main 받기 | `git switch main && git pull` |
| 내 브랜치 상태 | `git status` / `git log --oneline -5` |
| 타입 검증 | `npx tsc --noEmit` |
| 로컬 dev 서버 | `npm run dev` → http://localhost:3000 |

## 7. 막힐 때

- `gh: command not found` → 터미널을 새로 열었는지 확인. 그래도 안 되면 재설치.
- push 시 403/인증 오류 → `gh auth login` 다시 (HTTPS 선택했는지 확인).
- 머지 버튼이 안 눌림(충돌) → `git switch 브랜치 && git merge origin/main` 으로 충돌 해결 후 다시 푸시.
- `next dev`가 폰트 문제로 500 → AGENTS.md의 로컬 폰트 우회 참고 (커밋 금지).
