# checkfires — 소방점검 서비스

소방시설 점검을 **휴대폰 앱**으로 하고, 관리는 **관리자 웹 화면**에서 하는 서비스입니다. 같은 Firebase 프로젝트(`checkfires`)의 로그인 계정과 데이터를 함께 씁니다.

| 주소 | 내용 | 위치 |
| --- | --- | --- |
| `https://checkfires.web.app/` | **소방점검 폰 앱** — 작업·점검·사진·서명·제출, 건물 등록(주소 검색·CSV), 소방시설 배치 검토, 보고서 | `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` |
| `https://checkfires.web.app/admin/` | **관리자 웹 화면**(기존 통합 웹앱) — 계정 만들기, 작업 배정, 리포트 승인, 건물주 화면 | `admin/` |
| `/api/addr`, `/api/ledger` | 주소 검색·건축물대장 조회 서버(선택, Cloud Functions) | `functions/` |

> 점검 수량·배치 계산은 화재안전기준(NFTC)을 단순화한 참고용이며 설계·신고용이 아닙니다. 공식 서류로 쓰기 전에 전문가·관할 소방서 확인이 필요합니다.

## 폰 앱
- 체크파이어 계정(아이디/비밀번호)으로 로그인. 관리자는 운영자, 점검자는 점검원 화면이 됩니다. 건물주는 `/admin/`에서 봅니다.
- 데이터는 Firestore `mbuildings`·`mjobs`·`mreports`·`mphotos`·`mmeta`에 저장(기존 `buildings`·`jobs`·`reports`와 분리). 사진은 문서 크기 제한 때문에 설비별 `mphotos` 문서로 따로 저장하고, 작업·보고서에는 장수만 둡니다.
- 오프라인에서는 Firestore 로컬 캐시가 쓰기를 쌓았다가 연결되면 전송합니다(대기 건수가 앱 상단에 표시).
- 주소 검색: 운영자가 더보기 → 업체 정보에 **도로명주소 API 승인키**를 넣으면 건물 등록에서 주소를 검색합니다(키는 `mmeta/settings`에 저장, 코드에 넣지 않음). 건축물대장 자동 조회는 `functions/`(건축HUB 키) 배포 후 켜집니다. 그 전에는 층 구성을 직접 입력합니다.
- 서버 없이 시험: 이 저장소를 로컬에서 열면(`*.web.app`이 아니면) 샘플 데이터 모드로 동작합니다.

## 배포
`main`에 병합하면 GitHub Actions가 **호스팅(화면 파일)만** 자동 배포합니다. 아래는 직접 해야 합니다.
1. 보안 규칙: `firebase deploy --only firestore:rules --project checkfires` (시험: `tests/rules.test.js`, 에뮬레이터 필요)
2. 주소·대장 서버(선택): 키 등록 후 `firebase deploy --only functions --project checkfires` (Blaze 요금제). 자세한 순서는 [`functions/README.md`](functions/README.md)
3. 도로명주소 승인키는 사이트 주소 `https://checkfires.web.app`으로 신청합니다.

## 폴더
- `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` — 폰 앱
- `admin/` — 관리자 웹 화면(독립된 PWA, 자체 서비스 워커)
- `functions/` — 주소 검색·건축물대장 조회 서버와 단위 시험
- `firestore.rules`, `tests/rules.test.js` — 보안 규칙과 규칙 시험
- `design/` — 설계 문서: `wireframe-storyboard.html`(와이어프레임·수정 가능한 스토리보드·배치 검토 시안), `phone-app-standalone.html`(폰 앱 단일 파일 시험판, 샘플 데이터)
- `firebase.json`, `.firebaserc`, `.github/workflows/` — 호스팅 설정과 자동 배포
- `v3/` — 이전 버전 화면(보존용)

---

# 관리자 웹 화면 (`/admin/`)

### 두 가지 동작 방식
- **서버 모드** — Firebase(Auth + Firestore)에 저장합니다. 여러 사람이 각자 기기에서 함께 씁니다. `*.web.app` 배포 주소에서 자동으로 이 모드가 됩니다.
- **로컬 모드** — Firebase 연결이 없으면(로컬 실행 등) 이 기기·이 브라우저 안에만 저장합니다. 혼자 시험해 볼 때만 쓰세요.

### 서버 연결 설정 (Firebase 콘솔에서 한 번만)
1. **웹 앱 등록**: 프로젝트 설정 → 일반 → "내 앱"에서 웹(`</>`) 앱 추가. (호스팅이 이 구성값을 자동으로 앱에 전달합니다. 코드에 키를 넣지 않습니다.)
2. **로그인 방식**: 빌드 → Authentication → 시작하기 → 로그인 방법 → **이메일/비밀번호** 사용 설정. (앱은 아이디를 `아이디@checkfires.app` 형태로 변환해 쓰며 실제 메일은 보내지 않습니다.)
3. **데이터베이스**: 빌드 → Firestore Database → 데이터베이스 만들기(위치 `asia-northeast3` 서울 권장) → **규칙** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 붙여넣고 게시.
4. 배포된 주소를 열면 **"관리자 계정 만들기"** 화면이 나옵니다. 처음 한 번만 만들며, 이후 계정은 관리자 화면 → 사용자 탭에서 만듭니다.

(Firebase CLI가 있다면 `firebase deploy --only firestore:rules`로도 규칙을 올릴 수 있습니다.)

### 파일
- `admin/index.html` — 앱 전체(의존성 없음. Firebase SDK는 서버 모드일 때만 gstatic에서 불러옴)
- `firestore.rules` — 서버 보안 규칙(역할별 읽기·쓰기 제한)
- `admin/manifest.webmanifest`, `admin/sw.js`, `admin/icons/`, `admin/ledger.b64` — 설치형 앱과 건축물대장 검색 데이터
- `firebase.json`, `.firebaserc`, `.github/workflows/` — Firebase Hosting 설정과 push 시 자동 배포

### 배포
`main`에 push하면 GitHub Actions가 Firebase Hosting에 자동 배포합니다. 수동 배포: `firebase deploy --only hosting`.

### 로컬 실행
```bash
python3 -m http.server 8080   # 폰 앱 http://localhost:8080/ , 관리자 웹 http://localhost:8080/admin/ (로컬 모드)
```

### 데이터 구조 (Firestore)
`users`(계정·역할) · `buildings`(층별 면적·용도·좌표·건물주) · `jobs`(작업·배정·진행률·건물 스냅샷) · `reports`(제출 리포트·결함·사진·서명·조치 표시) · `meta/init`(최초 설정 표시)

### 알아둘 점
- 점검 입력은 점검자 기기에 자동 임시저장되고, 제출 시 서버로 올라갑니다. 제출은 온라인이어야 합니다(오프라인 대기열은 아직 없습니다).
- 사진은 리포트 문서(1 MB 한도)에 함께 저장되므로 제출 시 자동으로 줄입니다. 사진이 아주 많은 건물은 Firebase Storage로 분리하는 것이 좋습니다.
- 관리자가 다른 사람의 비밀번호를 대신 재설정하는 기능은 없습니다(본인이 로그인 후 변경). 분실 시 계정을 새로 만드세요.
- 계정 삭제 대신 "사용 중지"를 씁니다(중지된 계정은 로그인할 수 없음).
- 작업은 만들 때의 건물 정보를 복사해 가집니다. 건물 정보를 고치면 이후 만드는 작업부터 적용됩니다.

### 일반 앱처럼 쓰기
1. **홈 화면에 추가(PWA):** 배포된 주소를 휴대폰 Chrome으로 열고 메뉴 → "앱 설치/홈 화면에 추가".
2. **Google Play(Play Console)에 올리기:** HTTPS로 배포된 PWA를 Trusted Web Activity(TWA)로 감싸 AAB를 만듭니다.
   ```bash
   npm i -g @bubblewrap/cli
   bubblewrap init --manifest https://<도메인>/manifest.webmanifest
   bubblewrap build        # app-release-bundle.aab 생성
   ```
   - 패키지명(예: `kr.co.faircode.checkfires`)과 서명 키를 정하고 키는 따로 백업하세요.
   - 빌드 후 나오는 SHA-256 지문을 `https://<도메인>/.well-known/assetlinks.json`에 등록해야 주소창 없는 전체 화면으로 열립니다.
   - Play Console에서 앱 만들기 → AAB 업로드 → 개인정보처리방침·데이터 보안 양식·콘텐츠 등급 작성 → 심사. 위치·사진·계정 정보를 다루므로 개인정보처리방침이 필요합니다.

### v3 — 건축물대장 연동판 (`/v3/`)
`v3/index.html` 은 기존 앱과 **별도 페이지**로 추가된 업그레이드 시안입니다(기존 `index.html`·로그인·Firestore는 그대로).
- 국토교통부 건축물대장(총괄표제부·표제부, 2026-08) 상업시설 대지 148,368건을 파일 안에 압축 내장 → 주소(없는 지번은 가장 가까운 지번)·도로명·건물명 검색, 층수·연면적 자동 반영
- 소방 기준 14개 규칙 엔진(스프링클러 외 수치는 원문 대조 전)으로 층별 필수 설비 산출 → 3D 점검
- 역할별 규칙: 점검원(배정 수락 → 100 m 안 → 본인 담당 층만 입력 → 제출·보완 재제출), 관리자(작업 생성·배정·층 담당, 접수→확인 중→승인/보완 요청, 보완 사유 필수), 건물주(내 건물의 승인 리포트만, 조치 내용 필수)
- 관리자 모니터링: 용도·면적·지역(시도/시군구)·층수·사용승인 연대·소방안전관리자 등급·자체점검 종류별 대상 분포, 점검 진행·결함률·조치율, 교차표
- 저장은 브라우저 localStorage(시연). 서버 연동은 기존 앱의 Firebase 계층으로 옮겨야 합니다.

### 역할별 규칙 (화면 + `firestore.rules`에 같이 적용)
- 작업 상태: 미배정 → 배정 → **수락** → 진행 중 → 제출됨 → 승인 / 보완 요청 → 제출됨
- 점검자: 배정을 수락해야 점검 시작(거절 시 미배정 복귀), 제출 후 잠김, 보완 요청 시 같은 리포트를 수정본(ver↑)으로 재제출
- 관리자: 접수 → 확인 중 → 승인/보완 요청 순서만, 보완 요청은 사유 필수, 승인 후 수정 불가
- 건물주: 자기 건물의 승인 리포트만, 조치 완료는 조치 내용 필수(화면)
- `firestore.rules`는 자동 배포되지 않습니다. 콘솔에서 게시하거나 `firebase deploy --only firestore:rules`


### 건물 등록: 건축물대장 검색
건물 관리 → 건물 등록 화면 맨 위 "건축물대장에서 찾기"에서 도로명+번지, 동+지번, 건물명으로 검색해 선택하면 이름·주소·주 용도·층수·층별 면적(연면적÷층수 추정)이 채워집니다. 데이터는 `ledger.b64`(약 8MB, 근린생활·판매·업무·숙박·위락·문화집회·운동·의료·관광휴게 시설이 있는 대지 148,368곳)이며 처음 검색할 때만 내려받습니다. 좌표는 OpenStreetMap(Nominatim) 검색값으로 근사 입력하므로 현장에서 보정해야 합니다. 건물주 계정은 대장에 없어 수동 선택입니다.

