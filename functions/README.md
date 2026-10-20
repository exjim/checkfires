# 주소·건축물대장 조회 서버 (Firebase Cloud Functions)

앱 → `/api/addr`(주소 검색), `/api/ledger`(건축HUB 대장) → 이 함수 → 도로명주소 API / 건축HUB.
키는 서버 비밀값에만 둔다. 로그인한 사용자(Firebase ID 토큰)만 호출할 수 있다.

## 준비
1. 도로명주소 개발자센터(business.juso.go.kr)에서 승인키 발급. 사이트 주소는 배포 도메인(예: https://checkfires.web.app).
2. 공공데이터포털(data.go.kr)에서 "건축HUB_건축물대장정보 서비스" 활용신청 → 서비스키.
3. Firebase 프로젝트를 Blaze(종량제) 요금제로 전환 (Functions 외부 호출에 필요).

## 배포
    cd functions && npm install && npm test && cd ..
    firebase functions:secrets:set JUSO_KEY
    firebase functions:secrets:set HUB_KEY
    # firebase.json 에 firebase.hosting-snippet.json 의 functions/rewrites 항목을 합친다
    firebase deploy --only functions,hosting

## 앱 연결
- *.web.app 에서 열면 앱이 `/api`를 자동 사용한다. 다른 주소면 더보기 → 업체 정보의 "서버 API 주소"에 입력.
- 로그인 토큰: 앱에서 `window.faAuthToken = () => firebase.auth().currentUser.getIdToken()` 를 지정하면 요청에 실린다. (Auth 연동 단계에서 연결)

## 확인할 것
- 건축HUB 응답 필드명과 일일 호출 한도는 포털의 최신 명세로 확인 (코드는 표제부 getBrTitleInfo, 층별개요 getBrFlrOulnInfo 기준).
- `npm test` 는 가짜 응답으로만 검증한다. 실제 키로 한 번 호출해 확인할 것.
