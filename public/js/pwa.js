// public/js/pwa.js
// 서비스 워커를 등록합니다. 이 파일은 index.html과 chat.html 양쪽에 모두 넣습니다.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[pwa] 서비스워커 등록 실패:', err);
    });
  });
}
