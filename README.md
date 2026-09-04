# 실시간 번역 채팅 (Realtime Translate Chat)

아이디/비밀번호로 로그인하고, 친구를 검색해서 추가하고, 서로 다른 언어를 쓰는 친구와
자동 번역되는 실시간 채팅을 할 수 있는 웹앱입니다. UI는 한국어 / English / Français / 日本語
4개 언어를 지원합니다.

이 문서는 **GitHub Codespaces를 한 번도 안 써본 사람** 기준으로, 처음부터 끝까지 그대로 따라
하면 실행되도록 아주 자세히 적었습니다. 순서대로 따라오세요.

---

## 0. 미리 알아둘 것 (전체 그림)

- **GitHub 저장소(repository)**: 코드를 보관하는 온라인 폴더.
- **Codespace**: 그 저장소를 열어서 코드를 편집하고 실행할 수 있는, 브라우저 안의 가상 컴퓨터(VS Code).
- 이 프로젝트는 **Node.js(백엔드) + 그냥 HTML/CSS/JS(프론트엔드) + SQLite(데이터베이스 파일)** 로
  만들어져 있어서, 별도의 DB 서버 설치 없이 바로 실행됩니다.

---

## 1. GitHub 저장소 만들기

1. https://github.com 에 접속해서 로그인합니다 (계정이 없으면 먼저 가입).
2. 오른쪽 위 **+** 버튼 → **New repository** 클릭.
3. Repository name에 `realtime-translate-chat` 입력.
4. Public/Private 아무거나 선택 (개인 학습용이면 Private 추천).
5. 다른 옵션은 그대로 두고 **Create repository** 클릭.

## 2. Codespace 열기

1. 방금 만든 저장소 페이지에서 초록색 **Code** 버튼 클릭.
2. **Codespaces** 탭 선택 → **Create codespace on main** 클릭.
3. 잠시 기다리면 브라우저 안에 VS Code 화면이 뜹니다. (왼쪽에 폴더 탐색기, 가운데 편집창)

## 3. 이 프로젝트 파일을 Codespace 안에 넣기

제가 드린 `realtime-translate-chat.zip` 파일을 Codespace 안으로 옮기는 단계입니다.

1. Codespace 화면 왼쪽의 파일 탐색기(Explorer) 영역에, 다운로드해둔 `realtime-translate-chat.zip`
   파일을 **마우스로 끌어다 놓습니다 (드래그 앤 드롭)**. 업로드가 끝나면 탐색기에 zip 파일이 보입니다.
2. 상단 메뉴 **Terminal → New Terminal** 을 눌러 터미널 창을 엽니다.
3. 터미널에 아래 명령어를 한 줄씩 입력하고 Enter를 누릅니다.

   ```bash
   unzip realtime-translate-chat.zip -d temp_extract
   shopt -s dotglob
   mv temp_extract/realtime-translate-chat/* .
   rm -rf temp_extract realtime-translate-chat.zip
   ```

   (압축을 풀고, 안에 있는 파일들을 저장소 최상위 폴더로 옮기고, 임시 파일을 정리하는 명령어입니다.)

4. 탐색기를 보면 `server`, `public`, `package.json` 같은 파일/폴더들이 보여야 합니다.

## 4. 환경 설정 파일(.env) 만들기

터미널에 아래 명령어를 입력합니다.

```bash
cp .env.example .env
```

그 다음 왼쪽 탐색기에서 `.env` 파일을 클릭해서 열고, `JWT_SECRET=` 뒤에 아무 긴 문자열이나
입력해서 저장합니다 (예: `JWT_SECRET=asdf1234verysecretkey9876`). 이건 로그인 토큰을
암호화하는 데 쓰이는 비밀 값이라서, 아무거나 남들이 모를 문자열이면 됩니다.

## 5. 패키지 설치 및 실행

터미널에 순서대로 입력합니다.

```bash
npm install
```

(1~2분 정도 걸립니다. 완료되면)

```bash
npm start
```

터미널에 `서버가 실행되었습니다: http://localhost:3000` 이 뜨면 성공입니다.

## 6. 브라우저로 접속하기

Codespaces는 3000번 포트를 자동으로 감지해서 화면 오른쪽 아래에
**"Open in Browser"** 알림을 띄워줍니다. 그걸 누르거나, 아래쪽 **PORTS** 탭에서
3000번 포트 줄에 있는 지구본(🌐) 아이콘을 클릭하면 새 탭에서 앱이 열립니다.

## 7. 실제로 테스트해보기 (중요!)

로그인 정보는 브라우저에 저장되기 때문에, **같은 브라우저의 다른 탭**으로는 두 명의
사용자를 동시에 테스트할 수 없습니다. 아래처럼 테스트하세요.

1. 일반 창에서 계정 A(예: `alice`)로 회원가입.
2. **시크릿 모드(Incognito) 창**을 새로 열어서 (또는 다른 브라우저) 계정 B(예: `bob`)로
   회원가입, 이때 언어는 English로 선택.
3. A 화면에서 "친구 찾기" 검색창에 `bob` 검색 → 친구 추가 버튼 클릭.
4. B 화면에서 좌측 "받은 친구 요청"에 alice가 보이면 수락.
5. 양쪽 다 친구 목록에 서로가 뜨면, 클릭해서 채팅방을 열고 메시지를 보내보세요.
   A가 한국어로 보낸 메시지가 B 화면에는 영어로 번역되어 도착합니다.

## 8. 코드를 GitHub에 저장(커밋)하기

Codespace는 이미 여러분의 GitHub 계정과 연결되어 있어서, 아래 명령어만 입력하면 됩니다.

```bash
git add .
git commit -m "Initial commit: realtime translate chat app"
git push
```

---

## 파일 구조 설명 (각 파일이 하는 일)

```
realtime-translate-chat/
├─ server/                  ← 백엔드(서버) 코드
│  ├─ index.js              서버 시작점. Express + Socket.io 설정
│  ├─ db.js                 SQLite 데이터베이스 연결 및 테이블 생성
│  ├─ auth.js               로그인 토큰(JWT) 발급/검증 로직
│  ├─ translate.js          번역 API(MyMemory) 호출 함수
│  ├─ socket.js             실시간 채팅(소켓) 이벤트 처리
│  └─ routes/
│     ├─ auth.js            회원가입 / 로그인 / 내 언어 설정 API
│     ├─ friends.js         친구 검색 / 요청 / 수락·거절 / 목록 API
│     └─ messages.js        채팅 기록 불러오기 API
├─ public/                  ← 프론트엔드(화면) 코드, 브라우저에 그대로 보내짐
│  ├─ index.html            로그인/회원가입 화면
│  ├─ chat.html             채팅 메인 화면
│  ├─ css/style.css         전체 디자인
│  └─ js/
│     ├─ i18n.js            4개 언어 번역 문구 및 언어 전환 기능
│     ├─ auth.js            로그인/회원가입 화면의 동작
│     └─ app.js             채팅 화면의 동작 (친구목록, 실시간 송수신 등)
├─ .env.example             환경 설정 예시 파일 (복사해서 .env로 사용)
├─ .devcontainer/           Codespace 자동 설정 (포트, node 버전 등)
└─ package.json             프로젝트 정보 및 필요한 라이브러리 목록
```

### 데이터 흐름 요약

1. 브라우저(`public/js/*.js`)가 `/api/...` 로 fetch 요청을 보내면 → `server/routes/*.js` 가 처리 →
   `server/db.js` 를 통해 SQLite에 저장/조회합니다.
2. 로그인에 성공하면 서버가 **JWT 토큰**을 발급하고, 브라우저는 이걸 `localStorage`에 저장해서
   이후 모든 요청에 `Authorization: Bearer <토큰>` 헤더로 함께 보냅니다.
3. 실시간 채팅은 REST API가 아니라 **Socket.io**로 이루어집니다. 메시지를 보내면
   `server/socket.js`가 (1) 두 사람이 친구인지 확인 → (2) `translate.js`로 번역 →
   (3) DB에 원문+번역문 저장 → (4) 상대방이 접속해 있으면 실시간으로 전달합니다.

---

## 자주 겪을 수 있는 문제

- **`npm install` 중 에러가 남**: 터미널에 뜨는 에러 메시지를 그대로 저에게 보여주시면 원인을
  찾아드릴 수 있습니다. (better-sqlite3는 컴퓨터 환경에 맞게 컴파일되는 라이브러리라, 아주 드물게
  설치가 실패할 수 있습니다.)
- **번역이 안 되고 원문 그대로 옴**: 서버 터미널에 `[translate] 번역 실패` 로그가 찍히는지
  확인하세요. 사용 중인 MyMemory API는 **무료이고 하루 사용량 제한(비회원 기준 약 5,000단어/일)**
  이 있습니다. 한도를 넘으면 원문이 그대로 전달되도록 만들어 두었습니다(채팅 자체는 안 멈춤).
  한도를 늘리려면 `.env`의 `MYMEMORY_EMAIL`에 이메일 주소를 넣어보세요(하루 10,000단어까지 증가).
  그래도 안정성이 부족하면 `server/translate.js` 파일 하나만 DeepL이나 Google Cloud Translation
  API 호출로 교체하면 됩니다 (다른 파일은 손댈 필요 없음).
- **포트 3000이 자동으로 안 열림**: 하단 **PORTS** 탭에서 직접 3000을 찾아 지구본 아이콘을
  누르면 됩니다.
- **두 계정이 로그인이 자꾸 꼬임**: 위 "7. 테스트해보기"에서 설명한 것처럼, 반드시 시크릿 창
  또는 다른 브라우저를 사용해야 두 계정을 동시에 테스트할 수 있습니다.

## 지금은 없는 기능 (다음 단계로 시도해볼 것들)

- 그룹 채팅(단체방)
- 메시지 읽음 표시, 타이핑 중 표시
- 프로필 사진 업로드
- 비밀번호 찾기(이메일 인증)
- 운영 배포 시: HTTPS, 요청 속도 제한(rate limiting), 더 튼튼한 DB(PostgreSQL 등)로 교체,
  Render/Railway/Fly.io 같은 서비스에 배포

이 프로젝트는 학습/개인용 MVP 수준으로 만들어졌습니다. 실제 서비스로 운영하려면 위 "다음
단계" 항목들을 하나씩 추가하는 식으로 확장하시면 됩니다. 각 단계마다 어떻게 코드를 수정해야
하는지 언제든 물어보세요.
