# Claude Code Deployment Prompt (GitHub + Vercel)

너는 지금부터 DevOps + Frontend 배포 담당이다.
목표: 현재 로컬 Vite + React 프로젝트(pitching-timer)를 GitHub에 푸시하고, Vercel로 배포해서 누구나 접속 가능한 URL을 만든다.
원칙: 불필요한 변경 금지, 위험한 명령은 실행 전에 반드시 이유를 설명하고 승인 요청을 기다려라.
모든 단계는 "체크 → 실행 → 결과 확인" 순서로 진행하고, 실패 시 원인/해결책/재시도 명령을 제시해라.

[0] 사전 점검
- 현재 경로가 /Users/jo/firstproject/pitching-timer 인지 확인해라.
- node, npm 버전 확인하고(Vite 권장 범위 벗어나면 경고) 진행해라.
- npm install 상태 확인: node_modules 존재 여부 + package-lock.json 확인
- npm run build 를 실행해 빌드가 성공하는지 확인해라. 실패하면 에러 로그 기반으로 수정 제안(수정은 최소화) 후 다시 빌드해라.

[1] Git 준비
- git status로 변경사항 확인
- .gitignore에 node_modules, dist, .env, .DS_Store 등이 포함돼 있는지 확인. 없으면 추가해라.
- README.md가 없으면 아주 짧게 생성:
  - 앱 설명 2줄
  - 로컬 실행 방법: npm install / npm run dev
  - 빌드 방법: npm run build

[2] GitHub 리포지토리 생성 & Push
- 사용자가 GitHub CLI(gh) 로그인되어 있는지 확인해라(gh auth status).
- 가능하면 gh로 새 repo 생성:
  - repo 이름: pitching-timer
  - public repo
  - 기본 브랜치 main
- 원격(origin) 설정 확인 후, 아래 순서로 진행:
  - git init (필요 시)
  - git add .
  - git commit -m "Initial commit: pitching timer"
  - git branch -M main
  - git push -u origin main
- 만약 gh가 없거나 로그인 안 되어 있으면:
  - 사용자가 GitHub 웹에서 repo를 만들 수 있도록 필요한 정보(리포 이름, public, 생성 후 복사할 URL)만 안내하고,
  - 사용자가 origin URL을 주면 그 다음 단계부터 진행해라.

[3] Vercel 배포
- Vercel CLI(vercel)가 설치되어 있는지 확인해라(vercel --version).
- 없으면 설치 안내 및 설치 진행(사용자 승인 필요).
- vercel login 필요 여부 확인 후 로그인 진행 안내.
- 프로젝트 루트에서 vercel을 실행해 배포 세팅:
  - Framework: Vite
  - Build Command: npm run build
  - Output Directory: dist
  - Dev Command: npm run dev
- 배포 완료 후, Production 배포까지 진행(vercel --prod).
- 최종적으로 아래를 출력해라:
  1) GitHub repo URL
  2) Vercel Preview URL
  3) Vercel Production URL

[4] 배포 후 검증
- 배포 URL 접속 기준 체크리스트 5개 제시:
  - 첫 로딩 OK
  - 버튼 동작(Start/Lap/Stop/Reset)
  - 모바일 화면(가로/세로) UI 깨짐 여부
  - 새로고침 시 에러 없음
  - 콘솔 에러 없음(있으면 개선안)

주의: 로컬 파일을 수정해야 한다면 반드시 "왜 필요한지"와 "어떤 파일을 어떻게 바꾸는지"를 먼저 설명하고 승인 받은 뒤 실행해라.
이제 0단계부터 시작해.
