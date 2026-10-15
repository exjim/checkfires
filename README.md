# checkfires — 소방점검 통합 웹앱

법정 비치 기준 고지 → 3D 층별 점검(유무·수량·동작·사진) → 리포트 제출, 관리자(모니터링·작업 분배·3D 배정·리포트 승인)·건물주(결과 열람·조치 확인)를 담은 단일 페이지 앱입니다. 설치 가능한 PWA(오프라인 캐시 포함)입니다.

> **시연 버전입니다.** 입력·사진은 새로고침하면 사라지고(서버 없음), 사용자·관리자·건물주 전달은 한 화면 안에서 역할만 바꿔 보여줍니다. 법정 수치 일부는 원문 대조 전이라 앱 안에 "원문 대조 필요"로 표시되어 있습니다. 실제 점검에 쓰기 전에 전문가·관할 소방서 확인이 필요합니다.

## 파일
- `index.html` — 앱 전체(의존성 없음, Google Fonts만 외부)
- `manifest.webmanifest`, `sw.js`, `icons/` — 설치형 앱(PWA)용
- `firebase.json` — Firebase Hosting 설정
- `.nojekyll` — (GitHub Pages를 쓸 경우용)

## 로컬 실행
```bash
python3 -m http.server 8080   # http://localhost:8080
```
(`file://`로 열어도 앱은 동작하지만 서비스 워커·설치는 http(s)에서만 됩니다.)

## 배포 (Firebase Hosting) — 저장소는 비공개로 유지
GitHub 무료 플랜은 비공개 저장소에서 Pages를 쓸 수 없어 Firebase Hosting으로 배포합니다. 주소: `https://<프로젝트ID>.web.app`

```bash
npm i -g firebase-tools
firebase login
# 처음 한 번: Firebase 콘솔에서 프로젝트를 만들거나 기존 프로젝트 ID를 확인
firebase use --add <프로젝트ID>        # .firebaserc 생성(별칭 default)
firebase deploy --only hosting
```
- `firebase.json`이 저장소 루트를 그대로 올립니다(README·설정 파일 제외). `sw.js`와 `index.html`은 캐시하지 않도록 헤더를 지정했습니다.
- 수정 후 재배포: 같은 명령 `firebase deploy --only hosting`.
- 커스텀 도메인: Firebase 콘솔 → Hosting → "도메인 추가". Play 스토어(TWA)용 전체 화면 앱에는 도메인 루트가 필요하므로 이 방식이 유리합니다. `.well-known/assetlinks.json`을 저장소에 추가하고(`firebase.json`은 이미 이 경로를 서빙하도록 두었습니다) 다시 배포하세요.
- 자동 배포(GitHub Actions)가 필요하면 `firebase init hosting:github`로 워크플로와 서비스 계정 시크릿을 만들 수 있습니다.

## 일반 앱처럼 쓰기
1. **홈 화면에 추가(PWA):** 배포된 주소를 휴대폰 Chrome으로 열고 메뉴 → "앱 설치/홈 화면에 추가".
2. **Google Play(Play Console)에 올리기:** HTTPS로 배포된 PWA를 Trusted Web Activity(TWA)로 감싸 AAB를 만듭니다.
   ```bash
   npm i -g @bubblewrap/cli
   bubblewrap init --manifest https://<도메인>/manifest.webmanifest
   bubblewrap build        # app-release-bundle.aab 생성
   ```
   - 패키지명(예: `kr.co.faircode.checkfires`)과 서명 키를 정합니다. 키는 반드시 따로 백업하세요.
   - 빌드 후 나오는 SHA-256 지문을 `https://<도메인>/.well-known/assetlinks.json`에 등록해야 주소창 없는 전체 화면으로 열립니다. 도메인 루트에 `.well-known`을 둘 수 있는 Firebase Hosting(기본 `.web.app` 또는 커스텀 도메인)을 쓰세요.
   - Play Console에서 앱 만들기 → AAB 업로드 → 개인정보처리방침·데이터 보안 양식·콘텐츠 등급 작성 → 심사. 신규 개인 개발자 계정은 비공개 테스트 기간 요건이 있을 수 있으니 Play Console 안내를 확인하세요.
3. **Firebase 연동(실사용 단계):** Auth + Firestore + Storage로 점검 결과·사진·리포트를 저장하고 역할별 권한을 나눕니다. Google Cloud Console에서 프로젝트를 만들고 Firebase를 연결한 뒤 웹 앱 구성값을 `index.html`에 넣습니다. 이 저장소에는 키를 커밋하지 마세요(공개 웹 키는 보안 규칙으로 보호).
