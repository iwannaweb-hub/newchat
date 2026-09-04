// public/js/i18n.js
// 화면에 보이는 글자를 4개 언어로 바꿔주는 아주 단순한 다국어(i18n) 모듈입니다.
// 사용법: HTML 요소에 data-i18n="키이름" 을 붙여두면, applyLang()이 그 자리의 글자를 바꿔줍니다.
// 새 언어를 추가하고 싶으면 이 객체에 언어 코드(예: 'zh')와 번역을 통째로 추가하면 됩니다.

const TRANSLATIONS = {
  ko: {
    app_name: '실시간 번역 채팅',
    login_title: '로그인',
    register_title: '회원가입',
    username_label: '아이디',
    password_label: '비밀번호',
    ui_lang_label: '사용할 언어',
    login_button: '로그인',
    register_button: '회원가입',
    switch_to_register: '계정이 없으신가요? 회원가입',
    switch_to_login: '이미 계정이 있으신가요? 로그인',
    friends_label: '친구 목록',
    search_placeholder: '아이디로 친구 검색',
    search_button: '검색',
    add_friend_button: '친구 추가',
    requested_button: '요청됨',
    requests_label: '받은 친구 요청',
    accept_button: '수락',
    reject_button: '거절',
    message_placeholder: '메시지를 입력하세요',
    send_button: '보내기',
    logout_button: '로그아웃',
    no_friends_yet: '아직 친구가 없습니다. 위에서 친구를 검색해보세요.',
    no_requests: '받은 친구 요청이 없습니다.',
    select_friend_prompt: '왼쪽에서 대화할 친구를 선택하세요.',
    already_friends: '이미 친구',
    notify_off: '🔔 알림 켜기',
    notify_on: '🔔 알림 켜짐',
    notify_denied: '🔔 알림 차단됨 (브라우저 설정 필요)',
  },
  en: {
    app_name: 'Realtime Translate Chat',
    login_title: 'Log In',
    register_title: 'Sign Up',
    username_label: 'Username',
    password_label: 'Password',
    ui_lang_label: 'Language',
    login_button: 'Log In',
    register_button: 'Sign Up',
    switch_to_register: "Don't have an account? Sign up",
    switch_to_login: 'Already have an account? Log in',
    friends_label: 'Friends',
    search_placeholder: 'Search by username',
    search_button: 'Search',
    add_friend_button: 'Add Friend',
    requested_button: 'Requested',
    requests_label: 'Friend Requests',
    accept_button: 'Accept',
    reject_button: 'Reject',
    message_placeholder: 'Type a message',
    send_button: 'Send',
    logout_button: 'Log Out',
    no_friends_yet: 'No friends yet. Search for someone above.',
    no_requests: 'No pending friend requests.',
    select_friend_prompt: 'Select a friend on the left to start chatting.',
    already_friends: 'Already friends',
    notify_off: '🔔 Enable Notifications',
    notify_on: '🔔 Notifications On',
    notify_denied: '🔔 Blocked (check browser settings)',
  },
  fr: {
    app_name: 'Chat Traduit en Temps Réel',
    login_title: 'Connexion',
    register_title: 'Inscription',
    username_label: "Nom d'utilisateur",
    password_label: 'Mot de passe',
    ui_lang_label: 'Langue',
    login_button: 'Se connecter',
    register_button: "S'inscrire",
    switch_to_register: "Pas de compte ? S'inscrire",
    switch_to_login: 'Déjà un compte ? Se connecter',
    friends_label: 'Amis',
    search_placeholder: "Rechercher par nom d'utilisateur",
    search_button: 'Rechercher',
    add_friend_button: 'Ajouter',
    requested_button: 'Envoyée',
    requests_label: "Demandes d'amis",
    accept_button: 'Accepter',
    reject_button: 'Refuser',
    message_placeholder: 'Écrire un message',
    send_button: 'Envoyer',
    logout_button: 'Déconnexion',
    no_friends_yet: "Pas encore d'amis. Cherchez quelqu'un ci-dessus.",
    no_requests: "Aucune demande d'ami en attente.",
    select_friend_prompt: 'Choisissez un ami à gauche pour discuter.',
    already_friends: 'Déjà amis',
    notify_off: '🔔 Activer les notifications',
    notify_on: '🔔 Notifications activées',
    notify_denied: '🔔 Bloquées (voir réglages du navigateur)',
  },
  ja: {
    app_name: 'リアルタイム翻訳チャット',
    login_title: 'ログイン',
    register_title: '新規登録',
    username_label: 'ユーザー名',
    password_label: 'パスワード',
    ui_lang_label: '言語',
    login_button: 'ログイン',
    register_button: '登録する',
    switch_to_register: 'アカウントをお持ちでないですか？ 新規登録',
    switch_to_login: 'すでにアカウントをお持ちですか？ ログイン',
    friends_label: '友達一覧',
    search_placeholder: 'ユーザー名で検索',
    search_button: '検索',
    add_friend_button: '友達に追加',
    requested_button: '申請済み',
    requests_label: '届いた友達申請',
    accept_button: '承認',
    reject_button: '拒否',
    message_placeholder: 'メッセージを入力',
    send_button: '送信',
    logout_button: 'ログアウト',
    no_friends_yet: 'まだ友達がいません。上で検索してみましょう。',
    no_requests: '届いた友達申請はありません。',
    select_friend_prompt: '左側でチャットする友達を選んでください。',
    already_friends: 'すでに友達',
    notify_off: '🔔 通知を有効にする',
    notify_on: '🔔 通知オン',
    notify_denied: '🔔 ブロック中（ブラウザ設定を確認）',
  },
};

const SUPPORTED_LANGS = ['ko', 'en', 'fr', 'ja'];

function getSavedLang() {
  const saved = localStorage.getItem('ui_lang');
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  return 'ko';
}

function t(key, lang) {
  const l = lang || getSavedLang();
  return (TRANSLATIONS[l] && TRANSLATIONS[l][key]) || TRANSLATIONS.ko[key] || key;
}

// 페이지 안의 data-i18n / data-i18n-placeholder 요소들을 전부 찾아서 텍스트를 바꿉니다.
function applyLang(lang) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : getSavedLang();
  localStorage.setItem('ui_lang', l);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'), l);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), l));
  });

  document.querySelectorAll('.lang-select').forEach((sel) => {
    sel.value = l;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang(getSavedLang());
});
