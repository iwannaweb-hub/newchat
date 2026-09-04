// public/sw.js
// 서비스 워커: 실질적인 캐싱/가로채기는 하지 않고, 크롬/안드로이드가 "설치 가능한 앱"으로
// 인식하게 해주는 최소한의 역할만 합니다.
//
// 이전 버전은 화면 리소스를 가로채서 캐싱하려다가 사파리(iOS)에서 정상적인 페이지를
// 파일 다운로드로 잘못 처리하는 버그를 일으켰습니다. 안정성을 위해 아무것도 가로채지 않는
// "빈 껍데기" 서비스워커로 단순화했습니다. (오프라인 캐싱 기능은 포기하지만, 어차피 이 앱은
// 채팅이라 네트워크가 있어야 의미가 있으니 큰 손해는 아닙니다)

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch 리스너는 등록만 해두고 respondWith()를 절대 호출하지 않습니다.
// 이러면 모든 요청이 서비스 워커가 아예 없을 때와 똑같이 처리됩니다.
self.addEventListener('fetch', () => {
  // 의도적으로 아무 것도 하지 않습니다.
});